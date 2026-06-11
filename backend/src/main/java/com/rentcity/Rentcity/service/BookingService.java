package com.rentcity.Rentcity.service;

import com.rentcity.Rentcity.dto.BookingQuote;
import com.rentcity.Rentcity.dto.BookingResponse;
import com.rentcity.Rentcity.dto.CreateBookingRequest;
import com.rentcity.Rentcity.dto.AdminBookingTransitionRequest;
import com.rentcity.Rentcity.entity.*;
import com.rentcity.Rentcity.exception.ResourceNotFoundException;
import com.rentcity.Rentcity.repository.BookingRepository;
import com.rentcity.Rentcity.repository.CarRepository;
import com.rentcity.Rentcity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingService {

    private static final DateTimeFormatter BOOKING_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final CarRepository carRepository;
    private final BookingAvailabilityService bookingAvailabilityService;
    private final BookingPricingService bookingPricingService;
    private final BookingStateMachineService bookingStateMachineService;
    private final BookingCancellationPolicyService bookingCancellationPolicyService;
    private final NotificationService notificationService;

    @Transactional
    public BookingResponse createBooking(String email, CreateBookingRequest request) {
        validateRequest(request);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Car car = carRepository.findByIdForUpdate(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("xe", request.getVehicleId()));

        if (car.getStatus() != CarStatus.AVAILABLE) {
            throw new IllegalArgumentException("Xe hiện không sẵn sàng để đặt");
        }

        bookingAvailabilityService.ensureNoOverlap(car.getId(), request.getStartTime(), request.getEndTime());

        BookingQuote quote = bookingPricingService.calculateQuote(
                car,
                request.getStartTime(),
                request.getEndTime(),
                request.getPricingMode()
        );

        Booking booking = Booking.builder()
                .bookingCode(generateBookingCode())
                .userId(user.getId())
                .carId(car.getId())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .pricingMode(request.getPricingMode())
                .status(BookingStatus.PENDING)
                .depositStatus(DepositStatus.UNPAID)
                .baseAmount(quote.getBaseAmount())
                .depositAmount(quote.getDepositAmount())
                .totalAmount(quote.getTotalAmount())
                .freeCancelUntil(quote.getFreeCancelUntil())
                .build();

        Booking savedBooking = bookingRepository.save(booking);
        bookingStateMachineService.recordInitialStatus(
                savedBooking,
                user.getId(),
                user.getRole(),
                "BOOKING_CREATED",
                "Booking được tạo ở trạng thái chờ xác nhận"
        );

        notificationService.notifyBookingCreated(savedBooking, user, car);
        return mapToResponse(savedBooking);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getMyBookings(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<Booking> bookings = bookingRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        return mapToResponses(bookings);
    }

    @Transactional(readOnly = true)
    public BookingResponse getMyBooking(String email, Long bookingId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("booking", bookingId));

        if (!booking.getUserId().equals(user.getId())) {
            throw new ResourceNotFoundException("booking", bookingId);
        }

        return mapToResponse(booking);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getAdminBookings(
            BookingStatus status,
            Long vehicleId,
            Long userId,
            LocalDateTime fromTime,
            LocalDateTime toTime
    ) {
        List<Booking> bookings = bookingRepository.findAll(buildAdminBookingSpecification(
                status,
                vehicleId,
                userId,
                fromTime,
                toTime
        ), Sort.by(Sort.Direction.DESC, "createdAt"));
        return mapToResponses(bookings);
    }

    @Transactional(readOnly = true)
    public BookingResponse getAdminBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("booking", bookingId));
        return mapToResponse(booking);
    }

    @Transactional
    public BookingResponse cancelBooking(String email, Long bookingId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("booking", bookingId));

        if (!booking.getUserId().equals(user.getId())) {
            throw new ResourceNotFoundException("booking", bookingId);
        }

        if (booking.getStatus() != BookingStatus.PENDING && booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new IllegalArgumentException("Chỉ có thể hủy booking ở trạng thái PENDING hoặc CONFIRMED");
        }

        var cancelledAt = LocalDateTime.now();
        DepositStatus depositStatus = bookingCancellationPolicyService
                .determineDepositStatusAfterCustomerCancel(booking, cancelledAt);

        bookingStateMachineService.transition(
                booking,
                BookingStatus.CANCELLED,
                user.getId(),
                user.getRole(),
                "CUSTOMER_CANCELLED",
                buildCancelNote(depositStatus, cancelledAt, booking.getFreeCancelUntil())
        );

        booking.setDepositStatus(depositStatus);
        booking.setCancelledAt(cancelledAt);
        booking.setCancelReason("CUSTOMER_CANCELLED");
        booking.setCancelledBy(user.getEmail());

        Booking savedBooking = bookingRepository.save(booking);
        notificationService.notifyBookingStatusChanged(savedBooking, BookingStatus.CANCELLED);
        return mapToResponse(savedBooking);
    }

    @Transactional
    public BookingResponse transitionBookingAsAdmin(
            String actorEmail,
            Long bookingId,
            AdminBookingTransitionRequest request
    ) {
        User actor = userRepository.findByEmail(actorEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (actor.getRole() != Role.ADMIN && actor.getRole() != Role.STAFF) {
            throw new IllegalArgumentException("Chỉ admin hoặc staff mới được chuyển trạng thái booking");
        }

        Booking booking = bookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("booking", bookingId));

        bookingStateMachineService.transition(
                booking,
                request.getTargetStatus(),
                actor.getId(),
                actor.getRole(),
                normalizeReason(request.getReason(), request.getTargetStatus()),
                request.getNote()
        );

        if (request.getTargetStatus() == BookingStatus.CONFIRMED && booking.getDepositStatus() == DepositStatus.UNPAID) {
            booking.setDepositStatus(DepositStatus.PAID);
        }

        if (request.getTargetStatus() == BookingStatus.CANCELLED) {
            booking.setCancelledAt(LocalDateTime.now());
            booking.setCancelReason(normalizeReason(request.getReason(), request.getTargetStatus()));
            booking.setCancelledBy(actor.getEmail());
            if (booking.getDepositStatus() == DepositStatus.PAID) {
                booking.setDepositStatus(DepositStatus.REFUNDED);
            }
        }

        Booking savedBooking = bookingRepository.save(booking);
        notificationService.notifyBookingStatusChanged(savedBooking, request.getTargetStatus());
        return mapToResponse(savedBooking);
    }

    private void validateRequest(CreateBookingRequest request) {
        if (request.getPricingMode() == null) {
            return;
        }
        if (request.getStartTime() == null || request.getEndTime() == null) {
            return;
        }
        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new IllegalArgumentException("Thời gian bắt đầu phải trước thời gian kết thúc");
        }

        LocalDateTime now = LocalDateTime.now();
        if (!request.getStartTime().isAfter(now)) {
            throw new IllegalArgumentException("Thời gian bắt đầu phải ở tương lai");
        }

        Duration duration = Duration.between(request.getStartTime(), request.getEndTime());
        switch (request.getPricingMode()) {
            case HOURLY -> {
                if (duration.toMinutes() < 60) {
                    throw new IllegalArgumentException("Booking theo giờ phải tối thiểu 1 giờ");
                }
            }
            case DAILY -> {
                if (duration.toHours() < 24) {
                    throw new IllegalArgumentException("Booking theo ngày phải tối thiểu 1 ngày");
                }
            }
            case MONTHLY -> {
                if (duration.toDays() < 30) {
                    throw new IllegalArgumentException("Booking theo tháng phải tối thiểu 30 ngày");
                }
            }
        }
    }

    private BookingResponse mapToResponse(Booking booking) {
        Map<Long, User> usersById = userRepository.findAllById(Set.of(booking.getUserId()))
                .stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
        Map<Long, Car> carsById = carRepository.findAllById(Set.of(booking.getCarId()))
                .stream()
                .collect(Collectors.toMap(Car::getId, Function.identity()));
        return mapToResponse(booking, usersById, carsById);
    }

    private List<BookingResponse> mapToResponses(List<Booking> bookings) {
        if (bookings.isEmpty()) {
            return List.of();
        }

        Set<Long> userIds = bookings.stream().map(Booking::getUserId).collect(Collectors.toSet());
        Set<Long> carIds = bookings.stream().map(Booking::getCarId).collect(Collectors.toSet());

        Map<Long, User> usersById = userRepository.findAllById(userIds)
                .stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
        Map<Long, Car> carsById = carRepository.findAllById(carIds)
                .stream()
                .collect(Collectors.toMap(Car::getId, Function.identity()));

        return bookings.stream()
                .map(booking -> mapToResponse(booking, usersById, carsById))
                .toList();
    }

    private BookingResponse mapToResponse(Booking booking, Map<Long, User> usersById, Map<Long, Car> carsById) {
        User customer = usersById.get(booking.getUserId());
        Car car = carsById.get(booking.getCarId());
        String vehicleName = car != null ? buildVehicleName(car) : null;
        String primaryImageUrl = car != null
                ? extractPrimaryImageUrl(car)
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

    private String buildVehicleName(Car car) {
        return (car.getBrand() + " " + car.getModel()).trim();
    }

    private Specification<Booking> buildAdminBookingSpecification(
            BookingStatus status,
            Long vehicleId,
            Long userId,
            LocalDateTime fromTime,
            LocalDateTime toTime
    ) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }
            if (vehicleId != null) {
                predicates.add(criteriaBuilder.equal(root.get("carId"), vehicleId));
            }
            if (userId != null) {
                predicates.add(criteriaBuilder.equal(root.get("userId"), userId));
            }
            if (fromTime != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("startTime"), fromTime));
            }
            if (toTime != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("endTime"), toTime));
            }

            return predicates.isEmpty()
                    ? criteriaBuilder.conjunction()
                    : criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private String extractPrimaryImageUrl(Car car) {
        if (car.getImages() == null || car.getImages().isEmpty()) {
            return null;
        }

        return car.getImages().stream()
                .filter(CarImage::isPrimary)
                .map(CarImage::getImageUrl)
                .findFirst()
                .orElseGet(() -> car.getImages().stream()
                        .map(CarImage::getImageUrl)
                        .findFirst()
                        .orElse(null));
    }

    private String normalizeReason(String reason, BookingStatus targetStatus) {
        if (reason != null && !reason.isBlank()) {
            return reason.trim();
        }
        return switch (targetStatus) {
            case CONFIRMED -> "ADMIN_CONFIRMED";
            case ONGOING -> "ADMIN_CHECKOUT";
            case COMPLETED -> "ADMIN_COMPLETED";
            case CANCELLED -> "ADMIN_CANCELLED";
            case PENDING -> "ADMIN_REVERTED_TO_PENDING";
        };
    }

    private String buildCancelNote(DepositStatus depositStatus, LocalDateTime cancelledAt, LocalDateTime freeCancelUntil) {
        boolean freeCancellation = !cancelledAt.isAfter(freeCancelUntil);
        if (depositStatus == DepositStatus.REFUNDED) {
            return "Khách hủy trong thời gian miễn phí, tiền cọc được hoàn";
        }
        if (depositStatus == DepositStatus.FORFEITED) {
            return "Khách hủy sau thời hạn miễn phí, tiền cọc bị mất";
        }
        if (freeCancellation) {
            return "Khách hủy booking trước thời hạn miễn phí";
        }
        return "Khách hủy booking sau thời hạn miễn phí";
    }

    private String generateBookingCode() {
        String datePart = LocalDate.now().format(BOOKING_DATE_FORMAT);
        String randomPart = UUID.randomUUID()
                .toString()
                .replace("-", "")
                .substring(0, 6)
                .toUpperCase(Locale.ROOT);
        return "RC-" + datePart + "-" + randomPart;
    }
}
