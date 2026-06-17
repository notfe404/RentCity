package com.rentcity.Rentcity.service;

import com.rentcity.Rentcity.entity.Wallet;
import com.rentcity.Rentcity.entity.WalletTransaction;
import com.rentcity.Rentcity.entity.WalletTransactionType;
import com.rentcity.Rentcity.repository.UserRepository;
import com.rentcity.Rentcity.repository.WalletRepository;
import com.rentcity.Rentcity.repository.WalletTransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class WalletServiceTest {

    @Mock
    private WalletRepository walletRepository;
    @Mock
    private WalletTransactionRepository transactionRepository;
    @Mock
    private UserRepository userRepository;

    private final AtomicReference<Wallet> storedWallet = new AtomicReference<>();
    private final List<WalletTransaction> transactions = new ArrayList<>();
    private WalletService service;

    @BeforeEach
    void setUp() {
        service = new WalletService(walletRepository, transactionRepository, userRepository);
        when(walletRepository.findByUserId(1L))
                .thenAnswer(invocation -> Optional.ofNullable(storedWallet.get()));
        when(walletRepository.findByUserIdForUpdate(1L))
                .thenAnswer(invocation -> Optional.ofNullable(storedWallet.get()));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(invocation -> {
            Wallet wallet = invocation.getArgument(0);
            if (wallet.getId() == null) {
                wallet.setId(1L);
            }
            storedWallet.set(wallet);
            return wallet;
        });
        when(transactionRepository.existsByReference(any(String.class))).thenAnswer(invocation -> {
            String reference = invocation.getArgument(0);
            return transactions.stream().anyMatch(transaction -> reference.equals(transaction.getReference()));
        });
        when(transactionRepository.findByWalletIdOrderByCreatedAtDesc(1L))
                .thenAnswer(invocation -> new ArrayList<>(transactions));
        when(transactionRepository.save(any(WalletTransaction.class))).thenAnswer(invocation -> {
            WalletTransaction transaction = invocation.getArgument(0);
            transaction.setId((long) transactions.size() + 1);
            transactions.add(transaction);
            return transaction;
        });
    }

    @Test
    void depositPaymentCreditsThenHoldsFunds() {
        service.creditAndHoldDeposit(1L, 10L, new BigDecimal("300000"), "payment:10");

        assertThat(storedWallet.get().getAvailableBalance()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(storedWallet.get().getHeldBalance()).isEqualByComparingTo("300000");
        assertThat(transactions).extracting(WalletTransaction::getType)
                .containsExactly(WalletTransactionType.TOP_UP, WalletTransactionType.BOOKING_HOLD);
    }

    @Test
    void settlementUsesHeldThenAvailableAndRecordsOutstanding() {
        service.creditAndHoldDeposit(1L, 10L, new BigDecimal("300000"), "payment:10");
        service.creditTopUp(1L, new BigDecimal("100000"), "payment:11:wallet");

        WalletService.SettlementResult result = service.settleBooking(
                1L,
                10L,
                new BigDecimal("250000"),
                new BigDecimal("200000"),
                99L
        );

        assertThat(result.overduePaid()).isEqualByComparingTo("250000");
        assertThat(result.damagePaid()).isEqualByComparingTo("150000");
        assertThat(result.damageOutstanding()).isEqualByComparingTo("50000");
        assertThat(storedWallet.get().getAvailableBalance()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(storedWallet.get().getHeldBalance()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void legacyRefundCreditsWalletWhenNoHoldExists() {
        service.refundBookingDeposit(
                1L,
                10L,
                new BigDecimal("300000"),
                "booking:10:refund",
                "Legacy booking refund"
        );

        assertThat(storedWallet.get().getAvailableBalance()).isEqualByComparingTo("300000");
        assertThat(transactions.get(0).getType()).isEqualTo(WalletTransactionType.REFUND_CREDIT);
    }

    @Test
    void withdrawalReservesAvailableBalanceAndRejectionRestoresIt() {
        service.creditTopUp(1L, new BigDecimal("500000"), "payment:20:wallet");

        service.reserveWithdrawal(1L, new BigDecimal("200000"), "withdrawal:1:requested");

        assertThat(storedWallet.get().getAvailableBalance()).isEqualByComparingTo("300000");
        assertThat(transactions.get(1).getType()).isEqualTo(WalletTransactionType.WITHDRAWAL_REQUEST);

        service.reverseWithdrawal(1L, new BigDecimal("200000"), 99L, "withdrawal:1:rejected");

        assertThat(storedWallet.get().getAvailableBalance()).isEqualByComparingTo("500000");
        assertThat(transactions.get(2).getType()).isEqualTo(WalletTransactionType.WITHDRAWAL_REVERSED);
    }

    @Test
    void withdrawalCannotExceedAvailableBalance() {
        service.creditTopUp(1L, new BigDecimal("100000"), "payment:21:wallet");

        org.assertj.core.api.Assertions.assertThatThrownBy(
                        () -> service.reserveWithdrawal(
                                1L,
                                new BigDecimal("100001"),
                                "withdrawal:2:requested"
                        )
                )
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("exceeds available wallet balance");
    }
}
