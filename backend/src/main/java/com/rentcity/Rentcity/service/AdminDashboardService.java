package com.rentcity.Rentcity.service;

import com.rentcity.Rentcity.dto.AdminDashboardHotVehicleResponse;
import com.rentcity.Rentcity.dto.AdminDashboardMonthlyResponse;
import com.rentcity.Rentcity.entity.Booking;
import com.rentcity.Rentcity.entity.BookingStatus;
import com.rentcity.Rentcity.entity.Car;
import com.rentcity.Rentcity.repository.BookingRepository;
import com.rentcity.Rentcity.repository.CarRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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
