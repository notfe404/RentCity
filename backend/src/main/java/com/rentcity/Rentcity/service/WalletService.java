package com.rentcity.Rentcity.service;

import com.rentcity.Rentcity.dto.WalletResponse;
import com.rentcity.Rentcity.dto.WalletTransactionResponse;
import com.rentcity.Rentcity.entity.User;
import com.rentcity.Rentcity.entity.Wallet;
import com.rentcity.Rentcity.entity.WalletTransaction;
import com.rentcity.Rentcity.entity.WalletTransactionType;
import com.rentcity.Rentcity.repository.UserRepository;
import com.rentcity.Rentcity.repository.WalletRepository;
import com.rentcity.Rentcity.repository.WalletTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WalletService {

    private final WalletRepository walletRepository;
    private final WalletTransactionRepository transactionRepository;
    private final UserRepository userRepository;

    @Transactional
    public WalletResponse getMyWallet(String email) {
        User user = findUser(email);
        Wallet wallet = getOrCreateWallet(user.getId());
        return map(wallet, transactionRepository.findByWalletIdOrderByCreatedAtDesc(wallet.getId()));
    }

    @Transactional
    public void creditTopUp(Long userId, BigDecimal amount, String reference) {
        requirePositive(amount);
        if (transactionRepository.existsByReference(reference)) {
            return;
        }
        Wallet wallet = getOrCreateWalletForUpdate(userId);
        apply(wallet, null, WalletTransactionType.TOP_UP, amount, amount, BigDecimal.ZERO,
                reference, "Wallet top-up", userId);
    }

    @Transactional
    public void creditAndHoldDeposit(Long userId, Long bookingId, BigDecimal amount, String reference) {
        creditTopUp(userId, amount, reference + ":credit");
        holdDeposit(userId, bookingId, amount, reference + ":hold");
    }

    @Transactional
    public void holdDeposit(Long userId, Long bookingId, BigDecimal amount, String reference) {
        requirePositive(amount);
        if (transactionRepository.existsByReference(reference)) {
            return;
        }
        Wallet wallet = getOrCreateWalletForUpdate(userId);
        if (wallet.getAvailableBalance().compareTo(amount) < 0) {
            throw new IllegalArgumentException("Insufficient wallet balance for booking deposit");
        }
        apply(wallet, bookingId, WalletTransactionType.BOOKING_HOLD, amount, amount.negate(), amount,
                reference, "Booking security deposit held", userId);
    }

    @Transactional
    public void refundBookingDeposit(
            Long userId,
            Long bookingId,
            BigDecimal depositAmount,
            String reference,
            String description
    ) {
        if (transactionRepository.existsByReference(reference)) {
            return;
        }
        Wallet wallet = getOrCreateWalletForUpdate(userId);
        BigDecimal held = bookingHeldAmount(wallet.getId(), bookingId);
        if (held.signum() > 0) {
            apply(wallet, bookingId, WalletTransactionType.HOLD_RELEASE, held, held, held.negate(),
                    reference, description, userId);
        } else if (depositAmount != null && depositAmount.signum() > 0) {
            apply(wallet, bookingId, WalletTransactionType.REFUND_CREDIT, depositAmount,
                    depositAmount, BigDecimal.ZERO, reference, description, userId);
        }
    }

    @Transactional
    public void refundDamageFee(Long userId, Long bookingId, BigDecimal amount, String reference, Long actorId) {
        if (amount == null || amount.signum() <= 0) return;
        if (transactionRepository.existsByReference(reference)) return;
        
        Wallet wallet = getOrCreateWalletForUpdate(userId);
        apply(wallet, bookingId, WalletTransactionType.DAMAGE_FEE_REFUND, amount, amount, BigDecimal.ZERO, 
              reference, "Refund for excess damage fee over actual repair cost", actorId);
    }

    @Transactional
    public void forfeitBookingHold(Long userId, Long bookingId, String reference) {
        if (transactionRepository.existsByReference(reference)) {
            return;
        }
        Wallet wallet = getOrCreateWalletForUpdate(userId);
        BigDecimal held = bookingHeldAmount(wallet.getId(), bookingId);
        if (held.signum() <= 0) {
            return;
        }
        apply(wallet, bookingId, WalletTransactionType.FORFEITURE, held, BigDecimal.ZERO, held.negate(),
                reference, "Booking deposit forfeited", userId);
    }

    @Transactional
    public SettlementResult settleBooking(
            Long userId,
            Long bookingId,
            BigDecimal overdueCharge,
            BigDecimal damageCharge,
            Long actorId
    ) {
        Wallet wallet = getOrCreateWalletForUpdate(userId);
        BigDecimal held = bookingHeldAmount(wallet.getId(), bookingId);
        long timestamp = System.currentTimeMillis();
        BigDecimal overduePaid = chargeFromWallet(wallet, bookingId, overdueCharge,
                WalletTransactionType.OVERDUE_CHARGE, "booking:" + bookingId + ":overdue:" + timestamp, actorId);
        BigDecimal damagePaid = chargeFromWallet(wallet, bookingId, damageCharge,
                WalletTransactionType.DAMAGE_CHARGE, "booking:" + bookingId + ":damage:" + timestamp, actorId);
        BigDecimal remainingHeld = bookingHeldAmount(wallet.getId(), bookingId);
        if (remainingHeld.signum() > 0) {
            apply(wallet, bookingId, WalletTransactionType.HOLD_RELEASE, remainingHeld,
                    remainingHeld, remainingHeld.negate(), "booking:" + bookingId + ":release:" + timestamp,
                    "Unused booking deposit released", actorId);
        }
        return new SettlementResult(
                held,
                overduePaid,
                damagePaid,
                overdueCharge.subtract(overduePaid).max(BigDecimal.ZERO),
                damageCharge.subtract(damagePaid).max(BigDecimal.ZERO)
        );
    }



    @Transactional
    public void reserveWithdrawal(Long userId, BigDecimal amount, String reference) {
        requirePositive(amount);
        if (transactionRepository.existsByReference(reference)) {
            return;
        }
        Wallet wallet = getOrCreateWalletForUpdate(userId);
        if (wallet.getAvailableBalance().compareTo(amount) < 0) {
            throw new IllegalArgumentException("Withdrawal amount exceeds available wallet balance");
        }
        apply(wallet, null, WalletTransactionType.WITHDRAWAL_REQUEST, amount, amount.negate(),
                BigDecimal.ZERO, reference, "Withdrawal request submitted", userId);
    }

    @Transactional
    public void reverseWithdrawal(Long userId, BigDecimal amount, Long actorId, String reference) {
        requirePositive(amount);
        if (transactionRepository.existsByReference(reference)) {
            return;
        }
        Wallet wallet = getOrCreateWalletForUpdate(userId);
        apply(wallet, null, WalletTransactionType.WITHDRAWAL_REVERSED, amount, amount,
                BigDecimal.ZERO, reference, "Rejected withdrawal returned to wallet", actorId);
    }

    private BigDecimal chargeFromWallet(
            Wallet wallet,
            Long bookingId,
            BigDecimal requested,
            WalletTransactionType type,
            String reference,
            Long actorId
    ) {
        if (requested == null || requested.signum() <= 0 || transactionRepository.existsByReference(reference)) {
            return BigDecimal.ZERO;
        }
        BigDecimal held = bookingHeldAmount(wallet.getId(), bookingId);
        BigDecimal chargedFromHeld = requested.min(held);
        BigDecimal remaining = requested.subtract(chargedFromHeld);
        BigDecimal chargedFromAvailable = remaining.min(wallet.getAvailableBalance());
        BigDecimal charged = chargedFromHeld.add(chargedFromAvailable);
        if (charged.signum() > 0) {
            apply(wallet, bookingId, type, charged, chargedFromAvailable.negate(), chargedFromHeld.negate(),
                    reference, type == WalletTransactionType.DAMAGE_CHARGE
                            ? "Damage charge"
                            : "Overdue return charge", actorId);
        }
        return charged;
    }

    private BigDecimal bookingHeldAmount(Long walletId, Long bookingId) {
        return transactionRepository.findByWalletIdOrderByCreatedAtDesc(walletId).stream()
                .filter(transaction -> bookingId.equals(transaction.getBookingId()))
                .map(WalletTransaction::getHeldDelta)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .max(BigDecimal.ZERO);
    }

    private void apply(
            Wallet wallet,
            Long bookingId,
            WalletTransactionType type,
            BigDecimal amount,
            BigDecimal availableDelta,
            BigDecimal heldDelta,
            String reference,
            String description,
            Long actorId
    ) {
        wallet.setAvailableBalance(wallet.getAvailableBalance().add(availableDelta));
        wallet.setHeldBalance(wallet.getHeldBalance().add(heldDelta));
        if (wallet.getAvailableBalance().signum() < 0 || wallet.getHeldBalance().signum() < 0) {
            throw new IllegalStateException("Wallet balance cannot be negative");
        }
        walletRepository.save(wallet);
        transactionRepository.save(WalletTransaction.builder()
                .walletId(wallet.getId())
                .bookingId(bookingId)
                .type(type)
                .amount(amount)
                .availableDelta(availableDelta)
                .heldDelta(heldDelta)
                .availableBalanceAfter(wallet.getAvailableBalance())
                .heldBalanceAfter(wallet.getHeldBalance())
                .reference(reference)
                .description(description)
                .createdBy(actorId)
                .build());
    }

    private Wallet getOrCreateWallet(Long userId) {
        return walletRepository.findByUserId(userId)
                .orElseGet(() -> walletRepository.save(Wallet.builder().userId(userId).build()));
    }

    private Wallet getOrCreateWalletForUpdate(Long userId) {
        Wallet wallet = getOrCreateWallet(userId);
        return walletRepository.findByUserIdForUpdate(userId).orElse(wallet);
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private void requirePositive(BigDecimal amount) {
        if (amount == null || amount.signum() <= 0) {
            throw new IllegalArgumentException("Amount must be greater than zero");
        }
    }

    private WalletResponse map(Wallet wallet, List<WalletTransaction> transactions) {
        return WalletResponse.builder()
                .id(wallet.getId())
                .availableBalance(wallet.getAvailableBalance())
                .heldBalance(wallet.getHeldBalance())
                .totalBalance(wallet.getAvailableBalance().add(wallet.getHeldBalance()))
                .currency(wallet.getCurrency())
                .transactions(transactions.stream().map(this::mapTransaction).toList())
                .build();
    }

    private WalletTransactionResponse mapTransaction(WalletTransaction transaction) {
        return WalletTransactionResponse.builder()
                .id(transaction.getId())
                .bookingId(transaction.getBookingId())
                .type(transaction.getType())
                .amount(transaction.getAmount())
                .availableDelta(transaction.getAvailableDelta())
                .heldDelta(transaction.getHeldDelta())
                .availableBalanceAfter(transaction.getAvailableBalanceAfter())
                .heldBalanceAfter(transaction.getHeldBalanceAfter())
                .reference(transaction.getReference())
                .description(transaction.getDescription())
                .createdAt(transaction.getCreatedAt())
                .build();
    }

    public record SettlementResult(
            BigDecimal heldBefore,
            BigDecimal overduePaid,
            BigDecimal damagePaid,
            BigDecimal overdueOutstanding,
            BigDecimal damageOutstanding
    ) {
    }
}
