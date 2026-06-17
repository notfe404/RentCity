package com.rentcity.Rentcity.service;

import com.rentcity.Rentcity.dto.CarConditionRequest;
import com.rentcity.Rentcity.dto.DamageAssessmentResponse;
import com.rentcity.Rentcity.entity.*;
import com.rentcity.Rentcity.exception.ResourceNotFoundException;
import com.rentcity.Rentcity.repository.BookingRepository;
import com.rentcity.Rentcity.repository.DamageAssessmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class DamageAssessmentService {

    private final DamageAssessmentRepository assessmentRepository;
    private final BookingRepository bookingRepository;
    private final WalletService walletService;
    private final NotificationService notificationService;

    @Transactional
    public DamageAssessmentResponse assessAndSettle(
            Booking booking,
            CarConditionRequest request,
            Long actorId
    ) {
        if (!request.isDamageFound()) {
            return null;
        }
        if (request.getDamageDescription() == null || request.getDamageDescription().isBlank()) {
            throw new IllegalArgumentException("Damage description is required");
        }
        if (request.getDamageSeverity() == null) {
            throw new IllegalArgumentException("Damage severity is required");
        }
        if (request.getEstimatedDamageFee() == null || request.getEstimatedDamageFee().signum() < 0) {
            throw new IllegalArgumentException("Estimated damage fee is required");
        }

        DamageAssessment assessment = assessmentRepository.findByBookingId(booking.getId())
                .orElseGet(() -> DamageAssessment.builder()
                        .bookingId(booking.getId())
                        .assessedBy(actorId)
                        .build());
        BigDecimal damageFee = request.getEstimatedDamageFee();
        assessment.setDescription(request.getDamageDescription().trim());
        assessment.setSeverity(request.getDamageSeverity());
        assessment.setEstimatedFee(damageFee);
        assessment.setApprovedFee(damageFee);
        assessment.setChargedFee(BigDecimal.ZERO);
        assessment.setOutstandingFee(damageFee);
        assessment.setApprovedBy(actorId);
        assessment.setApprovedAt(LocalDateTime.now());
        assessment.setStatus(DamageAssessmentStatus.PARTIALLY_CHARGED);

        booking.setDamageFee(damageFee);
        booking.setOutstandingAmount(
                nonNull(booking.getTotalOverdueFee()).add(damageFee)
        );
        booking.setTotalAmount(booking.getTotalAmount().add(damageFee));
        bookingRepository.save(booking);
        return map(assessmentRepository.save(assessment));
    }

    @Transactional
    public DamageAssessmentResponse finalizeAssessment(Long bookingId, BigDecimal actualFee, Long actorId) {
        DamageAssessment assessment = assessmentRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Damage Assessment for booking", bookingId));

        if (assessment.getStatus() == DamageAssessmentStatus.RESOLVED) {
            throw new IllegalStateException("Damage assessment is already resolved");
        }

        assessment.setActualFee(actualFee);

        BigDecimal refundAmount = assessment.getChargedFee().subtract(actualFee).max(BigDecimal.ZERO);
        BigDecimal newOutstanding = actualFee.subtract(assessment.getChargedFee()).max(BigDecimal.ZERO);

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("booking", bookingId));

        if (refundAmount.signum() > 0) {
            walletService.refundDamageFee(
                    booking.getUserId(),
                    bookingId,
                    refundAmount,
                    "damage_refund:" + bookingId + ":" + System.currentTimeMillis(),
                    actorId
            );
            assessment.setRefundedFee(refundAmount);
            
            notificationService.notifyDamageRefund(booking, refundAmount);
        }

        assessment.setOutstandingFee(newOutstanding);
        assessment.setStatus(DamageAssessmentStatus.RESOLVED);

        BigDecimal difference = actualFee.subtract(assessment.getEstimatedFee());
        booking.setDamageFee(actualFee);
        booking.setTotalAmount(booking.getTotalAmount().add(difference));
        booking.setOutstandingAmount(booking.getOutstandingAmount().add(difference).max(BigDecimal.ZERO));
        bookingRepository.save(booking);

        return map(assessmentRepository.save(assessment));
    }



    @Transactional
    public void updatePaidAmount(Long bookingId, BigDecimal damagePaid) {
        if (damagePaid.signum() <= 0) return;
        assessmentRepository.findByBookingIdForUpdate(bookingId).ifPresent(assessment -> {
            assessment.setChargedFee(assessment.getChargedFee().add(damagePaid));
            assessment.setOutstandingFee(assessment.getOutstandingFee().subtract(damagePaid).max(BigDecimal.ZERO));
            assessment.setStatus(assessment.getOutstandingFee().signum() > 0
                    ? DamageAssessmentStatus.PARTIALLY_CHARGED
                    : DamageAssessmentStatus.CHARGED);
            assessmentRepository.save(assessment);
        });
    }

    @Transactional(readOnly = true)
    public DamageAssessmentResponse getByBooking(Long bookingId) {
        return assessmentRepository.findByBookingId(bookingId)
                .map(this::map)
                .orElse(null);
    }

    private BigDecimal nonNull(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private DamageAssessmentResponse map(DamageAssessment assessment) {
        return DamageAssessmentResponse.builder()
                .id(assessment.getId())
                .bookingId(assessment.getBookingId())
                .description(assessment.getDescription())
                .severity(assessment.getSeverity())
                .estimatedFee(assessment.getEstimatedFee())
                .approvedFee(assessment.getApprovedFee())
                .chargedFee(assessment.getChargedFee())
                .outstandingFee(assessment.getOutstandingFee())
                .actualFee(assessment.getActualFee())
                .refundedFee(assessment.getRefundedFee())
                .status(assessment.getStatus())
                .assessedBy(assessment.getAssessedBy())
                .approvedBy(assessment.getApprovedBy())
                .approvedAt(assessment.getApprovedAt())
                .createdAt(assessment.getCreatedAt())
                .build();
    }
}
