package com.rentcity.Rentcity.service;

import com.rentcity.Rentcity.dto.AdminDashboardBookingOperationsResponse;
import com.rentcity.Rentcity.dto.AdminDashboardFleetStatusResponse;
import com.rentcity.Rentcity.dto.AdminDashboardHotVehicleResponse;
import com.rentcity.Rentcity.dto.AdminDashboardMonthlyResponse;
import com.rentcity.Rentcity.dto.AdminDashboardOverviewResponse;
import com.rentcity.Rentcity.dto.AdminDashboardPaymentStatusResponse;
import com.rentcity.Rentcity.dto.AdminDashboardRecentBookingResponse;
import com.rentcity.Rentcity.entity.Booking;
import com.rentcity.Rentcity.entity.BookingStatus;
import com.rentcity.Rentcity.entity.Car;
import com.rentcity.Rentcity.entity.CarStatus;
import com.rentcity.Rentcity.entity.KycStatus;
import com.rentcity.Rentcity.entity.PaymentStatus;
import com.rentcity.Rentcity.entity.User;
import com.rentcity.Rentcity.repository.BookingRepository;
import com.rentcity.Rentcity.repository.CarRepository;
import com.rentcity.Rentcity.repository.PaymentRepository;
import com.rentcity.Rentcity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private static final int DASHBOARD_MONTHS = 12;

    private final BookingRepository bookingRepository;
    private final CarRepository carRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<AdminDashboardMonthlyResponse> getMonthlyDashboard() {
        YearMonth currentMonth = YearMonth.now();
        YearMonth startMonth = currentMonth.minusMonths(DASHBOARD_MONTHS - 1L);
        LocalDateTime from = startMonth.atDay(1).atStartOfDay();
        LocalDateTime to = currentMonth.plusMonths(1).atDay(1).atStartOfDay();

        Map<YearMonth, MonthlyAccumulator> monthlyData = initializeMonths(startMonth);
        List<Booking> bookings = bookingRepository
                .findByCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtAsc(from, to);

        bookings.forEach(booking -> addBooking(monthlyData, booking));

        Set<Long> hotVehicleIds = monthlyData.values().stream()
                .map(MonthlyAccumulator::findHotVehicleId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, Car> carsById = carRepository.findAllById(hotVehicleIds).stream()
                .collect(Collectors.toMap(Car::getId, Function.identity()));

        return monthlyData.entrySet().stream()
                .map(entry -> entry.getValue().toResponse(entry.getKey(), carsById))
                .toList();
    }

    @Transactional(readOnly = true)
    public AdminDashboardOverviewResponse getDashboardOverview() {
        LocalDate today = LocalDate.now();
        LocalDateTime todayStart = today.atStartOfDay();
        LocalDateTime tomorrowStart = today.plusDays(1).atStartOfDay();
        LocalDateTime twelveMonthsAgo = YearMonth.now()
                .minusMonths(DASHBOARD_MONTHS - 1L)
                .atDay(1)
                .atStartOfDay();
        LocalDateTime nextMonthStart = YearMonth.now()
                .plusMonths(1)
                .atDay(1)
                .atStartOfDay();

        long totalBookingsLast12Months = bookingRepository
                .countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(twelveMonthsAgo, nextMonthStart);
        long cancelledBookingsLast12Months = bookingRepository
                .countByStatusAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
                        BookingStatus.CANCELLED,
                        twelveMonthsAgo,
                        nextMonthStart
                );

        return AdminDashboardOverviewResponse.builder()
                .bookingOperations(buildBookingOperations(todayStart, tomorrowStart))
                .fleetStatus(buildFleetStatus())
                .paymentStatus(buildPaymentStatus())
                .totalBookingsLast12Months(totalBookingsLast12Months)
                .cancelledBookingsLast12Months(cancelledBookingsLast12Months)
                .cancellationRate(calculateRate(cancelledBookingsLast12Months, totalBookingsLast12Months))
                .pendingKycUsers(userRepository.countByKycStatus(KycStatus.PENDING))
                .recentBookings(buildRecentBookings())
                .build();
    }

    private AdminDashboardBookingOperationsResponse buildBookingOperations(
            LocalDateTime todayStart,
            LocalDateTime tomorrowStart
    ) {
        return AdminDashboardBookingOperationsResponse.builder()
                .pendingBookings(bookingRepository.countByStatus(BookingStatus.PENDING))
                .confirmedPickupsToday(bookingRepository.countByStatusAndStartTimeGreaterThanEqualAndStartTimeLessThan(
                        BookingStatus.PAID,
                        todayStart,
                        tomorrowStart
                ))
                .ongoingBookings(bookingRepository.countByStatus(BookingStatus.ONGOING))
                .returnsToday(bookingRepository.countByStatusInAndEndTimeGreaterThanEqualAndEndTimeLessThan(
                        List.of(BookingStatus.CONFIRMED, BookingStatus.PAID, BookingStatus.ONGOING),
                        todayStart,
                        tomorrowStart
                ))
                .build();
    }

    private AdminDashboardFleetStatusResponse buildFleetStatus() {
        return AdminDashboardFleetStatusResponse.builder()
                .totalCars(carRepository.count())
                .availableCars(carRepository.countByStatus(CarStatus.AVAILABLE))
                .maintenanceCars(carRepository.countByStatus(CarStatus.MAINTENANCE))
                .retiredCars(carRepository.countByStatus(CarStatus.RETIRED))
                .carsWithoutImages(carRepository.countCarsWithoutImages())
                .build();
    }

    private AdminDashboardPaymentStatusResponse buildPaymentStatus() {
        return AdminDashboardPaymentStatusResponse.builder()
                .pendingPayments(paymentRepository.countByStatus(PaymentStatus.PENDING))
                .paidPayments(paymentRepository.countByStatus(PaymentStatus.PAID))
                .failedPayments(paymentRepository.countByStatus(PaymentStatus.FAILED))
                .refundedPayments(paymentRepository.countByStatus(PaymentStatus.REFUNDED))
                .expiredPayments(paymentRepository.countByStatus(PaymentStatus.EXPIRED))
                .build();
    }

    private List<AdminDashboardRecentBookingResponse> buildRecentBookings() {
        List<Booking> bookings = bookingRepository.findTop5ByOrderByCreatedAtDesc();
        if (bookings.isEmpty()) {
            return List.of();
        }

        Set<Long> userIds = bookings.stream().map(Booking::getUserId).collect(Collectors.toSet());
        Set<Long> carIds = bookings.stream().map(Booking::getCarId).collect(Collectors.toSet());
        Map<Long, User> usersById = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
        Map<Long, Car> carsById = carRepository.findAllById(carIds).stream()
                .collect(Collectors.toMap(Car::getId, Function.identity()));

        return bookings.stream()
                .map(booking -> mapRecentBooking(booking, usersById, carsById))
                .toList();
    }

    private AdminDashboardRecentBookingResponse mapRecentBooking(
            Booking booking,
            Map<Long, User> usersById,
            Map<Long, Car> carsById
    ) {
        User user = usersById.get(booking.getUserId());
        Car car = carsById.get(booking.getCarId());

        return AdminDashboardRecentBookingResponse.builder()
                .id(booking.getId())
                .bookingCode(booking.getBookingCode())
                .vehicleId(booking.getCarId())
                .vehicleName(car != null ? buildVehicleName(car) : "Vehicle #" + booking.getCarId())
                .vehicleLicensePlate(car != null ? car.getLicensePlate() : null)
                .userId(booking.getUserId())
                .customerName(user != null ? user.getFullName() : null)
                .customerEmail(user != null ? user.getEmail() : null)
                .status(booking.getStatus())
                .depositStatus(booking.getDepositStatus())
                .totalAmount(booking.getTotalAmount())
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .createdAt(booking.getCreatedAt())
                .build();
    }

    private double calculateRate(long part, long total) {
        if (total == 0) {
            return 0;
        }
        return (double) part / total;
    }

    private String buildVehicleName(Car car) {
        return (car.getBrand() + " " + car.getModel()).trim();
    }

    private Map<YearMonth, MonthlyAccumulator> initializeMonths(YearMonth startMonth) {
        Map<YearMonth, MonthlyAccumulator> months = new LinkedHashMap<>();
        for (int i = 0; i < DASHBOARD_MONTHS; i++) {
            months.put(startMonth.plusMonths(i), new MonthlyAccumulator());
        }
        return months;
    }

    private void addBooking(Map<YearMonth, MonthlyAccumulator> monthlyData, Booking booking) {
        if (booking.getCreatedAt() == null) {
            return;
        }

        MonthlyAccumulator accumulator = monthlyData.get(YearMonth.from(booking.getCreatedAt()));
        if (accumulator == null) {
            return;
        }

        accumulator.totalBookings++;
        accumulator.vehicleBookingCounts.merge(booking.getCarId(), 1L, Long::sum);

        if (booking.getStatus() == BookingStatus.COMPLETED && booking.getTotalAmount() != null) {
            accumulator.completedRevenue = accumulator.completedRevenue.add(booking.getTotalAmount());
        }
    }

    private static class MonthlyAccumulator {
        private long totalBookings;
        private BigDecimal completedRevenue = BigDecimal.ZERO;
        private final Map<Long, Long> vehicleBookingCounts = new LinkedHashMap<>();

        private Long findHotVehicleId() {
            return vehicleBookingCounts.entrySet().stream()
                    .sorted((left, right) -> {
                        int byCount = Long.compare(right.getValue(), left.getValue());
                        if (byCount != 0) {
                            return byCount;
                        }
                        return Long.compare(left.getKey(), right.getKey());
                    })
                    .map(Map.Entry::getKey)
                    .findFirst()
                    .orElse(null);
        }

        private AdminDashboardMonthlyResponse toResponse(YearMonth month, Map<Long, Car> carsById) {
            Long hotVehicleId = findHotVehicleId();
            return AdminDashboardMonthlyResponse.builder()
                    .month(month.toString())
                    .totalBookings(totalBookings)
                    .completedRevenue(completedRevenue)
                    .hotVehicle(buildHotVehicle(hotVehicleId, carsById))
                    .build();
        }

        private AdminDashboardHotVehicleResponse buildHotVehicle(Long vehicleId, Map<Long, Car> carsById) {
            if (vehicleId == null) {
                return null;
            }

            Car car = carsById.get(vehicleId);
            return AdminDashboardHotVehicleResponse.builder()
                    .vehicleId(vehicleId)
                    .vehicleName(car != null ? (car.getBrand() + " " + car.getModel()).trim() : "Vehicle #" + vehicleId)
                    .licensePlate(car != null ? car.getLicensePlate() : null)
                    .bookingCount(vehicleBookingCounts.getOrDefault(vehicleId, 0L))
                    .build();
        }
    }
}
