package com.rentcity.Rentcity.service;

import com.rentcity.Rentcity.entity.Booking;
import com.rentcity.Rentcity.entity.BookingStatus;
import com.rentcity.Rentcity.entity.BookingStatusHistory;
import com.rentcity.Rentcity.entity.Role;
import com.rentcity.Rentcity.repository.BookingStatusHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class BookingStateMachineService {

    private static final Map<BookingStatus, Set<BookingStatus>> ALLOWED_TRANSITIONS = buildAllowedTransitions();

    private final BookingStatusHistoryRepository bookingStatusHistoryRepository;

    public void recordInitialStatus(Booking booking, Long changedByUserId, Role changedByRole, String reason, String note) {
        saveHistory(booking.getId(), null, booking.getStatus(), changedByUserId, changedByRole, reason, note);
    }

    public void transition(
            Booking booking,
            BookingStatus toStatus,
            Long changedByUserId,
            Role changedByRole,
            String reason,
            String note
    ) {
        BookingStatus fromStatus = booking.getStatus();
        assertAllowed(fromStatus, toStatus);
        booking.setStatus(toStatus);
        saveHistory(booking.getId(), fromStatus, toStatus, changedByUserId, changedByRole, reason, note);
    }

    private void assertAllowed(BookingStatus fromStatus, BookingStatus toStatus) {
        Set<BookingStatus> allowedTargets = ALLOWED_TRANSITIONS.getOrDefault(fromStatus, Set.of());
        if (!allowedTargets.contains(toStatus)) {
            throw new IllegalArgumentException(
                    "Không thể chuyển booking từ trạng thái " + fromStatus + " sang " + toStatus
            );
        }
    }

    private void saveHistory(
            Long bookingId,
            BookingStatus fromStatus,
            BookingStatus toStatus,
            Long changedByUserId,
            Role changedByRole,
            String reason,
            String note
    ) {
        bookingStatusHistoryRepository.save(BookingStatusHistory.builder()
                .bookingId(bookingId)
                .fromStatus(fromStatus)
                .toStatus(toStatus)
                .changedByUserId(changedByUserId)
                .changedByRole(changedByRole != null ? changedByRole.name() : null)
                .reason(reason)
                .note(note)
                .build());
    }

    private static Map<BookingStatus, Set<BookingStatus>> buildAllowedTransitions() {
        Map<BookingStatus, Set<BookingStatus>> transitions = new EnumMap<>(BookingStatus.class);
        transitions.put(BookingStatus.PENDING, EnumSet.of(BookingStatus.CONFIRMED, BookingStatus.CANCELLED));
        transitions.put(BookingStatus.CONFIRMED, EnumSet.of(BookingStatus.ONGOING, BookingStatus.CANCELLED));
        transitions.put(BookingStatus.ONGOING, EnumSet.of(BookingStatus.COMPLETED, BookingStatus.CANCELLED));
        transitions.put(BookingStatus.COMPLETED, EnumSet.noneOf(BookingStatus.class));
        transitions.put(BookingStatus.CANCELLED, EnumSet.noneOf(BookingStatus.class));
        return transitions;
    }
}
