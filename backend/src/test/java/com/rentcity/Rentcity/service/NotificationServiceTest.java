package com.rentcity.Rentcity.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rentcity.Rentcity.dto.NotificationResponse;
import com.rentcity.Rentcity.entity.*;
import com.rentcity.Rentcity.repository.NotificationRepository;
import com.rentcity.Rentcity.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    private NotificationService notificationService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        notificationService = new NotificationService(notificationRepository, userRepository, objectMapper);
    }

    @Test
    void getMyNotificationsReturnsOnlyCurrentUsersNotifications() throws Exception {
        User customer = user(1L, "customer@rentcity.test", Role.CUSTOMER);
        Notification notification = Notification.builder()
                .id(10L)
                .recipientUserId(customer.getId())
                .audience(NotificationAudience.USER)
                .type(NotificationType.BOOKING_CONFIRMED)
                .title("Booking confirmed")
                .message("Your booking is confirmed")
                .dataJson(objectMapper.writeValueAsString(Map.of("bookingId", "99")))
                .createdAt(LocalDateTime.now())
                .build();

        when(userRepository.findByEmail(customer.getEmail())).thenReturn(Optional.of(customer));
        when(notificationRepository.findByRecipientUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(customer.getId()))
                .thenReturn(List.of(notification));

        List<NotificationResponse> result = notificationService.getMyNotifications(customer.getEmail(), false);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getRecipientUserId()).isEqualTo(customer.getId());
        assertThat(result.get(0).getData()).containsEntry("bookingId", "99");
        verify(notificationRepository).findByRecipientUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(customer.getId());
        verify(notificationRepository, never()).findByRecipientUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(2L);
    }

    @Test
    void markAsReadSetsReadAtForOwnedNotification() {
        User customer = user(1L, "customer@rentcity.test", Role.CUSTOMER);
        Notification notification = Notification.builder()
                .id(10L)
                .recipientUserId(customer.getId())
                .audience(NotificationAudience.USER)
                .type(NotificationType.SYSTEM)
                .title("System")
                .message("Message")
                .createdAt(LocalDateTime.now())
                .build();

        when(userRepository.findByEmail(customer.getEmail())).thenReturn(Optional.of(customer));
        when(notificationRepository.findByIdAndRecipientUserIdAndDeletedAtIsNull(10L, customer.getId()))
                .thenReturn(Optional.of(notification));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));

        NotificationResponse response = notificationService.markAsRead(customer.getEmail(), 10L);

        assertThat(response.isRead()).isTrue();
        assertThat(notification.getReadAt()).isNotNull();
        verify(notificationRepository).save(notification);
    }

    @Test
    void deleteNotificationSoftDeletesOwnedNotification() {
        User customer = user(1L, "customer@rentcity.test", Role.CUSTOMER);
        Notification notification = Notification.builder()
                .id(10L)
                .recipientUserId(customer.getId())
                .audience(NotificationAudience.USER)
                .type(NotificationType.SYSTEM)
                .title("System")
                .message("Message")
                .createdAt(LocalDateTime.now())
                .build();

        when(userRepository.findByEmail(customer.getEmail())).thenReturn(Optional.of(customer));
        when(notificationRepository.findByIdAndRecipientUserIdAndDeletedAtIsNull(10L, customer.getId()))
                .thenReturn(Optional.of(notification));

        notificationService.deleteNotification(customer.getEmail(), 10L);

        assertThat(notification.getDeletedAt()).isNotNull();
        verify(notificationRepository).save(notification);
    }

    @Test
    void notifyBookingCreatedCreatesCustomerAndAdminStaffNotifications() {
        User customer = user(1L, "customer@rentcity.test", Role.CUSTOMER);
        User admin = user(2L, "admin@rentcity.test", Role.ADMIN);
        User staff = user(3L, "staff@rentcity.test", Role.STAFF);
        Booking booking = Booking.builder()
                .id(99L)
                .bookingCode("RC-20260608-ABC123")
                .userId(customer.getId())
                .carId(20L)
                .status(BookingStatus.PENDING)
                .depositStatus(DepositStatus.UNPAID)
                .startTime(LocalDateTime.now().plusDays(1))
                .endTime(LocalDateTime.now().plusDays(2))
                .pricingMode(PricingMode.DAILY)
                .baseAmount(BigDecimal.valueOf(1000000))
                .depositAmount(BigDecimal.valueOf(300000))
                .totalAmount(BigDecimal.valueOf(1000000))
                .freeCancelUntil(LocalDateTime.now().plusHours(12))
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        Car car = Car.builder()
                .id(20L)
                .brand("Kia")
                .model("Morning")
                .licensePlate("30A-777.66")
                .status(CarStatus.AVAILABLE)
                .build();

        when(userRepository.findByRoleIn(List.of(Role.ADMIN, Role.STAFF))).thenReturn(List.of(admin, staff));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(notificationRepository.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));

        notificationService.notifyBookingCreated(booking, customer, car);

        ArgumentCaptor<Notification> customerCaptor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(customerCaptor.capture());
        assertThat(customerCaptor.getValue().getRecipientUserId()).isEqualTo(customer.getId());
        assertThat(customerCaptor.getValue().getAudience()).isEqualTo(NotificationAudience.USER);
        assertThat(customerCaptor.getValue().getType()).isEqualTo(NotificationType.BOOKING_CREATED);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Notification>> adminCaptor = ArgumentCaptor.forClass(List.class);
        verify(notificationRepository).saveAll(adminCaptor.capture());
        assertThat(adminCaptor.getValue())
                .extracting(Notification::getRecipientUserId)
                .containsExactly(admin.getId(), staff.getId());
        assertThat(adminCaptor.getValue())
                .allMatch(notification -> notification.getAudience() == NotificationAudience.ADMIN_AND_STAFF);
    }

    @Test
    void notifyCompletedBookingCreatesReviewRequestForCustomer() {
        Booking booking = Booking.builder()
                .id(99L)
                .bookingCode("RC-20260608-ABC123")
                .userId(1L)
                .carId(20L)
                .status(BookingStatus.COMPLETED)
                .build();

        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));

        notificationService.notifyBookingStatusChanged(booking, BookingStatus.COMPLETED);

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        assertThat(captor.getValue().getRecipientUserId()).isEqualTo(booking.getUserId());
        assertThat(captor.getValue().getType()).isEqualTo(NotificationType.REVIEW_REQUEST);
        assertThat(captor.getValue().getDataJson()).contains("/review/99");
    }

    @Test
    void unreadCountReturnsZeroWhenUserHasNoUnreadNotifications() {
        User customer = user(1L, "customer@rentcity.test", Role.CUSTOMER);

        when(userRepository.findByEmail(customer.getEmail())).thenReturn(Optional.of(customer));
        when(notificationRepository.countByRecipientUserIdAndReadAtIsNullAndDeletedAtIsNull(customer.getId()))
                .thenReturn(0L);

        assertThat(notificationService.countMyUnreadNotifications(customer.getEmail())).isZero();
    }

    private User user(Long id, String email, Role role) {
        return User.builder()
                .id(id)
                .email(email)
                .fullName(email.split("@")[0])
                .password("password")
                .role(role)
                .kycStatus(KycStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();
    }
}
