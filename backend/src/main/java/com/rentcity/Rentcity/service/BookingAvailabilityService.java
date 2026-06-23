package com.rentcity.Rentcity.service;

import com.rentcity.Rentcity.entity.BookingStatus;
import com.rentcity.Rentcity.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class BookingAvailabilityService {

    private static final Set<BookingStatus> BLOCKING_STATUSES =
            EnumSet.of(BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.PAID, BookingStatus.ONGOING);

    private final BookingRepository bookingRepository;

    public void ensureNoOverlap(Long carId, LocalDateTime startTime, LocalDateTime endTime) {
        boolean overlapped = bookingRepository.existsOverlappingBooking(carId, startTime, endTime, BLOCKING_STATUSES);
        if (overlapped) {
            throw new IllegalArgumentException("Xe đã có booking chồng lấn trong khoảng thời gian đã chọn");
        }
    }

    public Set<Long> findUnavailableCarIds(LocalDateTime startTime, LocalDateTime endTime) {
        List<Long> ids = bookingRepository.findOverlappingCarIds(startTime, endTime, BLOCKING_STATUSES);
        return Set.copyOf(ids);
    }
}
