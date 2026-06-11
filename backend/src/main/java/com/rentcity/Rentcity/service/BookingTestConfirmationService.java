package com.rentcity.Rentcity.service;

import com.rentcity.Rentcity.dto.BookingResponse;
import com.rentcity.Rentcity.entity.Booking;
import com.rentcity.Rentcity.entity.BookingStatus;
import com.rentcity.Rentcity.entity.Car;
import com.rentcity.Rentcity.entity.CarImage;
import com.rentcity.Rentcity.entity.DepositStatus;
import com.rentcity.Rentcity.entity.Role;
import com.rentcity.Rentcity.entity.User;
import com.rentcity.Rentcity.exception.ResourceNotFoundException;
import com.rentcity.Rentcity.repository.BookingRepository;
import com.rentcity.Rentcity.repository.CarRepository;
import com.rentcity.Rentcity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BookingTestConfirmationService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final CarRepository carRepository;
    private final BookingStateMachineService bookingStateMachineService;
    private final NotificationService notificationService;
    private final Environment environment;

    @Transactional
    public BookingResponse confirmForTest(Long bookingId, String actorEmail) {
        ensureEnabledForCurrentEnvironment();

        User actor = userRepository.findByEmail(actorEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (actor.getRole() != Role.ADMIN && actor.getRole() != Role.STAFF) {
            throw new IllegalArgumentException("Chỉ admin hoặc staff mới được xác nhận booking bằng luồng test");
        }

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("booking", bookingId));

        bookingStateMachineService.transition(
                booking,
                BookingStatus.CONFIRMED,
                actor.getId(),
                actor.getRole(),
                "TEST_CONFIRMATION",
                "Xác nhận booking để test flow mà không qua thanh toán thật"
        );
        booking.setDepositStatus(DepositStatus.PAID);

        Booking savedBooking = bookingRepository.save(booking);
        notificationService.notifyBookingStatusChanged(savedBooking, BookingStatus.CONFIRMED);
        return mapToResponse(savedBooking);
    }

    private void ensureEnabledForCurrentEnvironment() {
        if (!environment.acceptsProfiles("dev", "test")) {
            throw new IllegalArgumentException("Test confirmation chỉ được bật ở môi trường dev hoặc test");
        }
    }

    private BookingResponse mapToResponse(Booking booking) {
        User customer = userRepository.findById(booking.getUserId()).orElse(null);
        Car car = carRepository.findById(booking.getCarId()).orElse(null);
        String vehicleName = car != null ? (car.getBrand() + " " + car.getModel()).trim() : null;
        String primaryImageUrl = car != null
                ? car.getImages().stream().filter(CarImage::isPrimary).map(CarImage::getImageUrl).findFirst().orElse(null)
                : null;

        return BookingResponse.builder()
                .id(booking.getId())
                .bookingCode(booking.getBookingCode())
                .vehicleId(booking.getCarId())
                .userId(booking.getUserId())
                .vehicleName(vehicleName)
                .vehicleLicensePlate(car != null ? car.getLicensePlate() : null)
                .vehiclePrimaryImageUrl(primaryImageUrl)
                .customerName(customer != null ? customer.getFullName() : null)
                .customerEmail(customer != null ? customer.getEmail() : null)
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .pricingMode(booking.getPricingMode())
                .status(booking.getStatus())
                .depositStatus(booking.getDepositStatus())
                .baseAmount(booking.getBaseAmount())
                .depositAmount(booking.getDepositAmount())
                .totalAmount(booking.getTotalAmount())
                .freeCancelUntil(booking.getFreeCancelUntil())
                .cancelledAt(booking.getCancelledAt())
                .cancelReason(booking.getCancelReason())
                .cancelledBy(booking.getCancelledBy())
                .createdAt(booking.getCreatedAt())
                .updatedAt(booking.getUpdatedAt())
                .build();
    }
}
