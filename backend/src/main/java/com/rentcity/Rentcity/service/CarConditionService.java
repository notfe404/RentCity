package com.rentcity.Rentcity.service;

import com.rentcity.Rentcity.dto.CarConditionImageResponse;
import com.rentcity.Rentcity.dto.CarConditionRequest;
import com.rentcity.Rentcity.dto.CarConditionResponse;
import com.rentcity.Rentcity.entity.*;
import com.rentcity.Rentcity.exception.ResourceNotFoundException;
import com.rentcity.Rentcity.repository.CarConditionImageRepository;
import com.rentcity.Rentcity.repository.CarConditionReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CarConditionService {
    private static final Long DEFAULT_ODOMETER = 0L;
    private static final Integer DEFAULT_FUEL_LEVEL = 100;

    private final CarConditionReportRepository reportRepository;
    private final CarConditionImageRepository imageRepository;
    private final FileStorageService fileStorageService;

    @Transactional
    public CarConditionReport createInitial(Long carId, CarConditionRequest request, Long actorId, Role actorRole) {
        return createReport(carId, null, CarConditionReportType.INITIAL, request, actorId, actorRole);
    }

    @Transactional
    public CarConditionReport createHandover(
            Long carId,
            Long bookingId,
            CarConditionRequest request,
            Long actorId,
            Role actorRole,
            List<MultipartFile> files
    ) {
        if (reportRepository.findFirstByBookingIdAndReportTypeOrderByCreatedAtDesc(
                bookingId,
                CarConditionReportType.HANDOVER
        ).isPresent()) {
            throw new IllegalArgumentException("A handover condition already exists for this booking");
        }
        CarConditionReport report = createReport(
                carId,
                bookingId,
                CarConditionReportType.HANDOVER,
                request,
                actorId,
                actorRole
        );
        return addImages(report, files);
    }

    @Transactional
    public CarConditionReport createReturn(
            Long carId,
            Long bookingId,
            CarConditionRequest request,
            Long actorId,
            Role actorRole,
            List<MultipartFile> files
    ) {
        if (reportRepository.findFirstByBookingIdAndReportTypeOrderByCreatedAtDesc(
                bookingId,
                CarConditionReportType.RETURN
        ).isPresent()) {
            throw new IllegalArgumentException("A return condition already exists for this booking");
        }

        CarConditionReport report = createReport(
                carId,
                bookingId,
                CarConditionReportType.RETURN,
                request,
                actorId,
                actorRole
        );
        return addImages(report, files);
    }

    @Transactional
    public CarConditionResponse uploadInitialImages(Long carId, List<MultipartFile> files) {
        CarConditionReport report = reportRepository.findFirstByCarIdOrderByCreatedAtDesc(carId)
                .filter(item -> item.getReportType() == CarConditionReportType.INITIAL)
                .orElseThrow(() -> new ResourceNotFoundException("initial car condition", carId));
        return mapToResponse(addImages(report, files));
    }

    @Transactional
    public CarConditionResponse uploadReturnImages(Long bookingId, List<MultipartFile> files) {
        CarConditionReport report = reportRepository.findFirstByBookingIdAndReportTypeOrderByCreatedAtDesc(
                        bookingId,
                        CarConditionReportType.RETURN
                )
                .orElseThrow(() -> new ResourceNotFoundException("return car condition", bookingId));
        return mapToResponse(addImages(report, files));
    }

    @Transactional(readOnly = true)
    public CarConditionResponse getCurrent(Long carId) {
        return reportRepository.findFirstByCarIdOrderByCreatedAtDesc(carId)
                .map(this::mapToResponse)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public CarConditionResponse getById(Long reportId) {
        if (reportId == null) {
            return null;
        }
        return reportRepository.findById(reportId)
                .map(this::mapToResponse)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public CarConditionResponse getBookingReport(Long bookingId, CarConditionReportType type) {
        return reportRepository.findFirstByBookingIdAndReportTypeOrderByCreatedAtDesc(bookingId, type)
                .map(this::mapToResponse)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<CarConditionResponse> getBookingReports(Long bookingId) {
        return reportRepository.findByBookingIdOrderByCreatedAtAsc(bookingId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public CarConditionResponse mapToResponse(CarConditionReport report) {
        return CarConditionResponse.builder()
                .id(report.getId())
                .carId(report.getCarId())
                .bookingId(report.getBookingId())
                .reportType(report.getReportType())
                .condition(report.getCondition())
                .damageFound(report.isDamageFound())
                .notes(report.getNotes())
                .createdAt(report.getCreatedAt())
                .images(report.getImages().stream()
                        .sorted(java.util.Comparator.comparingInt(CarConditionImage::getDisplayOrder))
                        .map(image -> CarConditionImageResponse.builder()
                                .id(image.getId())
                                .imageUrl(image.getImageUrl())
                                .displayOrder(image.getDisplayOrder())
                                .build())
                        .toList())
                .build();
    }

    private CarConditionReport createReport(
            Long carId,
            Long bookingId,
            CarConditionReportType type,
            CarConditionRequest request,
            Long actorId,
            Role actorRole
    ) {
        CarConditionReport report = CarConditionReport.builder()
                .carId(carId)
                .bookingId(bookingId)
                .reportType(type)
                .condition(request.getCondition())
                .odometer(DEFAULT_ODOMETER)
                .fuelLevel(DEFAULT_FUEL_LEVEL)
                .damageFound(request.isDamageFound())
                .notes(normalizeNotes(request.getNotes()))
                .createdByUserId(actorId)
                .createdByRole(actorRole != null ? actorRole.name() : null)
                .build();
        return reportRepository.save(report);
    }

    private CarConditionReport addImages(CarConditionReport report, List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            return report;
        }

        int nextOrder = report.getImages().size();
        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) {
                continue;
            }
            CarConditionImage image = CarConditionImage.builder()
                    .report(report)
                    .imageUrl(fileStorageService.store(file, "conditions"))
                    .displayOrder(nextOrder++)
                    .build();
            report.getImages().add(image);
            imageRepository.save(image);
        }
        return reportRepository.save(report);
    }

    private String normalizeNotes(String notes) {
        return notes == null || notes.isBlank() ? null : notes.trim();
    }
}
