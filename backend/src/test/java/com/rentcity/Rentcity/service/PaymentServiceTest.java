package com.rentcity.Rentcity.service;

import com.rentcity.Rentcity.dto.CreateDamagePaymentRequest;
import com.rentcity.Rentcity.dto.PaymentResponse;
import com.rentcity.Rentcity.entity.Booking;
import com.rentcity.Rentcity.entity.DepositStatus;
import com.rentcity.Rentcity.entity.Payment;
import com.rentcity.Rentcity.entity.PaymentGateway;
import com.rentcity.Rentcity.entity.PaymentStatus;
import com.rentcity.Rentcity.entity.PaymentType;
import com.rentcity.Rentcity.entity.PricingMode;
import com.rentcity.Rentcity.entity.Role;
import com.rentcity.Rentcity.entity.User;
import com.rentcity.Rentcity.entity.BookingStatus;
import com.rentcity.Rentcity.entity.FinalPaymentStatus;
import com.rentcity.Rentcity.repository.BookingRepository;
import com.rentcity.Rentcity.repository.DamageAssessmentRepository;
import com.rentcity.Rentcity.repository.PaymentRepository;
import com.rentcity.Rentcity.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private BookingRepository bookingRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private BookingStateMachineService bookingStateMachineService;
    @Mock
    private BookingCancellationPolicyService bookingCancellationPolicyService;
    @Mock
    private NotificationService notificationService;
    @Mock
    private BookingExpirationService bookingExpirationService;
    @Mock
    private WalletService walletService;
    @Mock
    private DamageAssessmentRepository damageAssessmentRepository;
    @Mock
    private DamageAssessmentService damageAssessmentService;
    @Mock
    private BookingService bookingService;

    private PaymentService service;

    @BeforeEach
    void setUp() {
        service = new PaymentService(
                paymentRepository,
                bookingRepository,
                userRepository,
                bookingStateMachineService,
                bookingCancellationPolicyService,
                notificationService,
                bookingExpirationService,
                walletService,
                damageAssessmentRepository,
                damageAssessmentService
        );
        ReflectionTestUtils.setField(service, "bookingService", bookingService);
        ReflectionTestUtils.setField(service, "publicBaseUrl", "http://localhost:8080/api");
    }

    @Test
    void createsFreshPendingFinalRentalPaymentRequest() {
        User customer = User.builder()
                .id(7L)
                .email("customer@example.com")
                .role(Role.CUSTOMER)
                .build();
        Booking booking = Booking.builder()
                .id(42L)
                .bookingCode("RC-TEST")
                .userId(customer.getId())
                .carId(3L)
                .pricingMode(PricingMode.DAILY)
                .depositStatus(DepositStatus.PAID)
                .status(BookingStatus.COMPLETED)
                .finalPaymentStatus(FinalPaymentStatus.PAYMENT_REQUESTED)
                .totalAmount(new BigDecimal("1500000"))
                .depositAmount(new BigDecimal("500000"))
                .outstandingAmount(new BigDecimal("300000"))
                .build();
        Payment oldPaidPayment = Payment.builder()
                .id(100L)
                .bookingId(booking.getId())
                .userId(customer.getId())
                .type(PaymentType.FINAL_RENTAL_PAYMENT)
                .gateway(PaymentGateway.VNPAY)
                .status(PaymentStatus.PAID)
                .amount(new BigDecimal("1000000"))
                .currency("VND")
                .gatewayReference("vnpay-old")
                .idempotencyKey("old-key")
                .paidAt(LocalDateTime.now().minusDays(1))
                .build();
        CreateDamagePaymentRequest request = new CreateDamagePaymentRequest();
        request.setGateway(PaymentGateway.VNPAY);
        request.setIdempotencyKey("new-damage-key");

        when(userRepository.findByEmail(customer.getEmail())).thenReturn(Optional.of(customer));
        when(bookingRepository.findByIdForUpdate(booking.getId())).thenReturn(Optional.of(booking));
        when(bookingService.applyCustomerWalletBalance(booking.getId(), customer.getId()))
                .thenReturn(BigDecimal.ZERO);
        when(paymentRepository.findByIdempotencyKey("new-damage-key")).thenReturn(Optional.empty());
        when(paymentRepository.findByBookingIdAndStatus(booking.getId(), PaymentStatus.PENDING))
                .thenReturn(List.of());
        when(paymentRepository.findFirstByBookingIdAndGatewayAndTypeAndStatusInOrderByCreatedAtDesc(
                booking.getId(),
                PaymentGateway.VNPAY,
                PaymentType.FINAL_RENTAL_PAYMENT,
                Set.of(PaymentStatus.PAID)
        )).thenReturn(Optional.of(oldPaidPayment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment payment = invocation.getArgument(0);
            payment.setId(101L);
            return payment;
        });

        PaymentResponse response = service.createBookingPayment(customer.getEmail(), booking.getId(), request);

        assertThat(response.getStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(response.getAmount()).isEqualByComparingTo("300000");
        assertThat(response.getPaymentUrl()).contains("reference=" + response.getGatewayReference());

        ArgumentCaptor<Payment> paymentCaptor = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository).save(paymentCaptor.capture());
        Payment savedPayment = paymentCaptor.getValue();
        assertThat(savedPayment.getId()).isEqualTo(101L);
        assertThat(savedPayment.getStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(savedPayment.getType()).isEqualTo(PaymentType.FINAL_RENTAL_PAYMENT);
        assertThat(savedPayment.getAmount()).isEqualByComparingTo("300000");
        assertThat(savedPayment.getIdempotencyKey()).isEqualTo("new-damage-key");
        verify(bookingService).applyCustomerWalletBalance(eq(booking.getId()), eq(customer.getId()));
    }

    @Test
    void completedSecurityDepositForwardsExactGatewayToBooking() {
        User customer = User.builder()
                .id(7L)
                .email("customer@example.com")
                .role(Role.CUSTOMER)
                .build();
        Booking booking = Booking.builder()
                .id(42L)
                .bookingCode("RC-DEPOSIT")
                .userId(customer.getId())
                .carId(3L)
                .depositStatus(DepositStatus.PAID)
                .status(BookingStatus.CONFIRMED)
                .build();
        Payment payment = Payment.builder()
                .id(102L)
                .bookingId(booking.getId())
                .userId(customer.getId())
                .type(PaymentType.SECURITY_DEPOSIT)
                .gateway(PaymentGateway.PAYPAL)
                .status(PaymentStatus.PENDING)
                .amount(new BigDecimal("5000000"))
                .currency("VND")
                .gatewayReference("paypal-security-deposit")
                .createdAt(LocalDateTime.now())
                .build();

        when(userRepository.findByEmail(customer.getEmail())).thenReturn(Optional.of(customer));
        when(userRepository.findById(customer.getId())).thenReturn(Optional.of(customer));
        when(paymentRepository.findByIdForUpdate(payment.getId())).thenReturn(Optional.of(payment));
        when(bookingRepository.findByIdForUpdate(booking.getId())).thenReturn(Optional.of(booking));
        when(paymentRepository.save(payment)).thenReturn(payment);

        PaymentResponse response = service.mockPaymentSuccess(customer.getEmail(), payment.getId());

        assertThat(response.getStatus()).isEqualTo(PaymentStatus.PAID);
        verify(bookingService).applyCustomerPayment(
                booking.getId(),
                payment.getAmount(),
                customer.getId(),
                payment.getId(),
                PaymentType.SECURITY_DEPOSIT,
                PaymentGateway.PAYPAL
        );
    }
}
