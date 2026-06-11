package com.rentcity.Rentcity.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rentcity.Rentcity.dto.NotificationResponse;
import com.rentcity.Rentcity.entity.*;
import com.rentcity.Rentcity.exception.ResourceNotFoundException;
import com.rentcity.Rentcity.repository.NotificationRepository;
import com.rentcity.Rentcity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final TypeReference<Map<String, String>> STRING_MAP_TYPE = new TypeReference<>() {
    };

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<NotificationResponse> getMyNotifications(String email, boolean unreadOnly) {
        User user = findUserByEmail(email);
        List<Notification> notifications = unreadOnly
                ? notificationRepository.findByRecipientUserIdAndReadAtIsNullAndDeletedAtIsNullOrderByCreatedAtDesc(user.getId())
                : notificationRepository.findByRecipientUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(user.getId());

        return notifications.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public long countMyUnreadNotifications(String email) {
        User user = findUserByEmail(email);
        return notificationRepository.countByRecipientUserIdAndReadAtIsNullAndDeletedAtIsNull(user.getId());
    }

    @Transactional
    public NotificationResponse markAsRead(String email, Long notificationId) {
        User user = findUserByEmail(email);
        Notification notification = findOwnedNotification(notificationId, user.getId());
        if (notification.getReadAt() == null) {
            notification.setReadAt(LocalDateTime.now());
        }
        return mapToResponse(notificationRepository.save(notification));
    }

    @Transactional
    public void markAllAsRead(String email) {
        User user = findUserByEmail(email);
        List<Notification> unread = notificationRepository
                .findByRecipientUserIdAndReadAtIsNullAndDeletedAtIsNullOrderByCreatedAtDesc(user.getId());
        LocalDateTime now = LocalDateTime.now();
        unread.forEach(notification -> notification.setReadAt(now));
        notificationRepository.saveAll(unread);
    }

    @Transactional
    public void deleteNotification(String email, Long notificationId) {
        User user = findUserByEmail(email);
        Notification notification = findOwnedNotification(notificationId, user.getId());
        notification.setDeletedAt(LocalDateTime.now());
        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyBookingCreated(Booking booking, User customer, Car car) {
        Map<String, String> customerData = bookingData(booking, car, "/my-bookings/" + booking.getId());
        createForUser(
                customer.getId(),
                NotificationAudience.USER,
                NotificationType.BOOKING_CREATED,
                "Đã tạo booking",
                "Booking " + booking.getBookingCode() + " đang chờ xác nhận.",
                customerData
        );

        Map<String, String> adminData = bookingData(booking, car, "/admin/bookings");
        putIfPresent(adminData, "customerName", customer.getFullName());
        putIfPresent(adminData, "customerEmail", customer.getEmail());
        createForAdminsAndStaff(
                NotificationType.BOOKING_CREATED,
                "Booking mới cần xử lý",
                customerDisplayName(customer) + " vừa tạo booking " + booking.getBookingCode() + ".",
                adminData
        );
    }

    @Transactional
    public void notifyBookingStatusChanged(Booking booking, BookingStatus targetStatus) {
        NotificationType type = switch (targetStatus) {
            case CONFIRMED -> NotificationType.BOOKING_CONFIRMED;
            case ONGOING -> NotificationType.BOOKING_ONGOING;
            case COMPLETED -> NotificationType.REVIEW_REQUEST;
            case CANCELLED -> NotificationType.BOOKING_CANCELLED;
            case PENDING -> null;
        };
        if (type == null) {
            return;
        }

        String customerTargetUrl = targetStatus == BookingStatus.COMPLETED
                ? "/review/" + booking.getId()
                : "/my-bookings/" + booking.getId();
        Map<String, String> data = bookingData(booking, null, customerTargetUrl);
        createForUser(
                booking.getUserId(),
                NotificationAudience.USER,
                type,
                bookingStatusTitle(targetStatus),
                bookingStatusMessage(booking, targetStatus),
                data
        );

        if (targetStatus == BookingStatus.CONFIRMED && isToday(booking.getStartTime())) {
            createForAdminsAndStaff(
                    NotificationType.SYSTEM,
                    "Lịch nhận xe hôm nay",
                    "Booking " + booking.getBookingCode() + " có lịch nhận xe trong hôm nay.",
                    bookingData(booking, null, "/admin/bookings")
            );
        }

        if (targetStatus == BookingStatus.ONGOING && isToday(booking.getEndTime())) {
            createForAdminsAndStaff(
                    NotificationType.SYSTEM,
                    "Lịch trả xe hôm nay",
                    "Booking " + booking.getBookingCode() + " có lịch trả xe trong hôm nay.",
                    bookingData(booking, null, "/admin/bookings")
            );
        }

        if (targetStatus == BookingStatus.CANCELLED) {
            createForAdminsAndStaff(
                    type,
                    "Booking đã hủy",
                    "Booking " + booking.getBookingCode() + " đã được hủy.",
                    bookingData(booking, null, "/admin/bookings")
            );
        }
    }

    @Transactional
    public void notifyPaymentPending(Payment payment, Booking booking) {
        Map<String, String> data = paymentData(payment, booking, "/admin/payments");
        createForAdminsAndStaff(
                NotificationType.PAYMENT_PENDING,
                "Thanh toán đang chờ",
                "Booking " + bookingCode(booking, payment) + " có thanh toán " + payment.getGateway() + " đang chờ.",
                data
        );
    }

    @Transactional
    public void notifyPaymentStatusChanged(Payment payment, PaymentStatus status) {
        NotificationType type = switch (status) {
            case PAID -> NotificationType.PAYMENT_PAID;
            case FAILED -> NotificationType.PAYMENT_FAILED;
            case REFUNDED -> NotificationType.PAYMENT_REFUNDED;
            case EXPIRED -> NotificationType.PAYMENT_EXPIRED;
            case PENDING -> null;
        };
        if (type == null) {
            return;
        }

        Map<String, String> data = paymentData(payment, null, "/payments");
        createForUser(
                payment.getUserId(),
                NotificationAudience.USER,
                type,
                paymentStatusTitle(status),
                paymentStatusMessage(payment, status),
                data
        );

        if (status == PaymentStatus.FAILED || status == PaymentStatus.EXPIRED) {
            createForAdminsAndStaff(
                    type,
                    paymentStatusTitle(status),
                    "Thanh toán #" + payment.getId() + " cho booking #" + payment.getBookingId() + " cần kiểm tra.",
                    paymentData(payment, null, "/admin/payments")
            );
        }
    }

    @Transactional
    public void notifyKycPending(User user, Long documentId) {
        Map<String, String> data = new HashMap<>();
        putIfPresent(data, "userId", user.getId());
        putIfPresent(data, "documentId", documentId);
        putIfPresent(data, "targetUrl", "/admin/users");
        putIfPresent(data, "customerName", user.getFullName());
        putIfPresent(data, "customerEmail", user.getEmail());

        createForAdminsAndStaff(
                NotificationType.KYC_PENDING,
                "Hồ sơ KYC cần duyệt",
                customerDisplayName(user) + " vừa tải hồ sơ xác minh.",
                data
        );
    }

    private void createForAdminsAndStaff(NotificationType type, String title, String message, Map<String, String> data) {
        List<User> recipients = userRepository.findByRoleIn(List.of(Role.ADMIN, Role.STAFF));
        List<Notification> notifications = recipients.stream()
                .map(user -> buildNotification(
                        user.getId(),
                        NotificationAudience.ADMIN_AND_STAFF,
                        type,
                        title,
                        message,
                        data
                ))
                .toList();
        notificationRepository.saveAll(notifications);
    }

    private void createForUser(
            Long recipientUserId,
            NotificationAudience audience,
            NotificationType type,
            String title,
            String message,
            Map<String, String> data
    ) {
        notificationRepository.save(buildNotification(recipientUserId, audience, type, title, message, data));
    }

    private Notification buildNotification(
            Long recipientUserId,
            NotificationAudience audience,
            NotificationType type,
            String title,
            String message,
            Map<String, String> data
    ) {
        return Notification.builder()
                .recipientUserId(recipientUserId)
                .audience(audience)
                .type(type)
                .title(title)
                .message(message)
                .dataJson(writeData(data))
                .build();
    }

    private Notification findOwnedNotification(Long notificationId, Long userId) {
        return notificationRepository.findByIdAndRecipientUserIdAndDeletedAtIsNull(notificationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("notification", notificationId));
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private NotificationResponse mapToResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .recipientUserId(notification.getRecipientUserId())
                .audience(notification.getAudience())
                .type(notification.getType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .body(notification.getMessage())
                .data(readData(notification.getDataJson()))
                .isRead(notification.getReadAt() != null)
                .readAt(notification.getReadAt())
                .createdAt(notification.getCreatedAt())
                .build();
    }

    private Map<String, String> bookingData(Booking booking, Car car, String targetUrl) {
        Map<String, String> data = new HashMap<>();
        putIfPresent(data, "bookingId", booking.getId());
        putIfPresent(data, "bookingCode", booking.getBookingCode());
        putIfPresent(data, "vehicleId", booking.getCarId());
        putIfPresent(data, "targetUrl", targetUrl);
        if (car != null) {
            putIfPresent(data, "vehicleName", (car.getBrand() + " " + car.getModel()).trim());
            putIfPresent(data, "licensePlate", car.getLicensePlate());
        }
        return data;
    }

    private Map<String, String> paymentData(Payment payment, Booking booking, String targetUrl) {
        Map<String, String> data = new HashMap<>();
        putIfPresent(data, "paymentId", payment.getId());
        putIfPresent(data, "bookingId", payment.getBookingId());
        putIfPresent(data, "bookingCode", bookingCode(booking, payment));
        putIfPresent(data, "paymentStatus", payment.getStatus());
        putIfPresent(data, "gateway", payment.getGateway());
        putIfPresent(data, "amount", payment.getAmount());
        putIfPresent(data, "currency", payment.getCurrency());
        putIfPresent(data, "targetUrl", targetUrl);
        return data;
    }

    private void putIfPresent(Map<String, String> data, String key, Object value) {
        if (value != null) {
            data.put(key, String.valueOf(value));
        }
    }

    private String writeData(Map<String, String> data) {
        try {
            return objectMapper.writeValueAsString(data == null ? Map.of() : data);
        } catch (JsonProcessingException ex) {
            return "{}";
        }
    }

    private Map<String, String> readData(String dataJson) {
        if (dataJson == null || dataJson.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(dataJson, STRING_MAP_TYPE);
        } catch (JsonProcessingException ex) {
            return Map.of();
        }
    }

    private String customerDisplayName(User user) {
        if (user.getFullName() != null && !user.getFullName().isBlank()) {
            return user.getFullName();
        }
        return user.getEmail();
    }

    private String bookingCode(Booking booking, Payment payment) {
        if (booking != null && booking.getBookingCode() != null) {
            return booking.getBookingCode();
        }
        return "#" + payment.getBookingId();
    }

    private boolean isToday(LocalDateTime value) {
        return value != null && value.toLocalDate().equals(LocalDateTime.now().toLocalDate());
    }

    private String bookingStatusTitle(BookingStatus status) {
        return switch (status) {
            case CONFIRMED -> "Booking đã được xác nhận";
            case ONGOING -> "Đã bắt đầu thuê xe";
            case COMPLETED -> "Đánh giá chuyến xe";
            case CANCELLED -> "Booking đã hủy";
            case PENDING -> "Booking đang chờ";
        };
    }

    private String bookingStatusMessage(Booking booking, BookingStatus status) {
        return switch (status) {
            case CONFIRMED -> "Booking " + booking.getBookingCode() + " đã được xác nhận.";
            case ONGOING -> "Booking " + booking.getBookingCode() + " đang trong thời gian thuê.";
            case COMPLETED -> "Booking " + booking.getBookingCode() + " đã hoàn tất. Hãy chia sẻ trải nghiệm của bạn.";
            case CANCELLED -> "Booking " + booking.getBookingCode() + " đã được hủy.";
            case PENDING -> "Booking " + booking.getBookingCode() + " đang chờ xử lý.";
        };
    }

    private String paymentStatusTitle(PaymentStatus status) {
        return switch (status) {
            case PAID -> "Thanh toán thành công";
            case FAILED -> "Thanh toán thất bại";
            case REFUNDED -> "Đã hoàn tiền";
            case EXPIRED -> "Thanh toán hết hạn";
            case PENDING -> "Thanh toán đang chờ";
        };
    }

    private String paymentStatusMessage(Payment payment, PaymentStatus status) {
        return switch (status) {
            case PAID -> "Thanh toán #" + payment.getId() + " đã thành công.";
            case FAILED -> "Thanh toán #" + payment.getId() + " thất bại. Vui lòng thử lại hoặc chọn cổng khác.";
            case REFUNDED -> "Thanh toán #" + payment.getId() + " đã được hoàn tiền.";
            case EXPIRED -> "Thanh toán #" + payment.getId() + " đã hết hạn.";
            case PENDING -> "Thanh toán #" + payment.getId() + " đang chờ xử lý.";
        };
    }
}
