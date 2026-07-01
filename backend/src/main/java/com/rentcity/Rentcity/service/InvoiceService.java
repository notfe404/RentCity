package com.rentcity.Rentcity.service;

import com.rentcity.Rentcity.entity.*;
import com.rentcity.Rentcity.exception.ResourceNotFoundException;
import com.rentcity.Rentcity.repository.BookingRepository;
import com.rentcity.Rentcity.repository.CarRepository;
import com.rentcity.Rentcity.repository.PaymentRepository;
import com.rentcity.Rentcity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.Duration;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private static final DateTimeFormatter DATE_TIME_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private static final DecimalFormat MONEY_FORMAT = new DecimalFormat("#,###", DecimalFormatSymbols.getInstance(Locale.US));

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final CarRepository carRepository;
    private final PaymentRepository paymentRepository;

    @Transactional(readOnly = true)
    public byte[] generateBookingInvoice(String email, Long bookingId) {
        User actor = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("booking", bookingId));

        if (!isStaffOrAdmin(actor) && !booking.getUserId().equals(actor.getId())) {
            throw new ResourceNotFoundException("booking", bookingId);
        }

        User customer = userRepository.findById(booking.getUserId()).orElse(null);
        Car car = carRepository.findById(booking.getCarId()).orElse(null);
        Payment reservationPayment = paymentRepository
                .findFirstByBookingIdAndTypeOrderByCreatedAtDesc(
                        bookingId,
                        PaymentType.DEPOSIT
                )
                .orElse(null);
        Payment finalRentalPayment = paymentRepository
                .findFirstByBookingIdAndTypeOrderByCreatedAtDesc(
                        bookingId,
                        PaymentType.FINAL_RENTAL_PAYMENT
                )
                .orElse(null);

        try {
            return buildInvoicePdf(booking, customer, car, reservationPayment, finalRentalPayment);
        } catch (IOException ex) {
            throw new IllegalStateException("Cannot generate invoice PDF", ex);
        }
    }

    private byte[] buildInvoicePdf(
            Booking booking,
            User customer,
            Car car,
            Payment reservationPayment,
            Payment finalRentalPayment
    ) throws IOException {
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            try (PDPageContentStream content = new PDPageContentStream(document, page)) {
                float y = 770;
                y = writeTitle(content, "RentCity Booking Invoice", y);
                y = writeLine(content, "Invoice generated from RentCity booking and payment records.", y - 10);
                y = writeSeparator(content, y - 8);

                y = writeSection(content, "Booking", y - 22);
                y = writeRow(content, "Booking code", booking.getBookingCode(), y);
                y = writeRow(content, "Booking status", booking.getStatus().name(), y);
                y = writeRow(content, "Reservation status", booking.getDepositStatus().name(), y);
                y = writeRow(content, "Created at", formatDateTime(booking.getCreatedAt()), y);

                y = writeSection(content, "Customer", y - 12);
                y = writeRow(content, "Name", customer != null ? customer.getFullName() : "-", y);
                y = writeRow(content, "Email", customer != null ? customer.getEmail() : "-", y);
                y = writeRow(content, "Phone", customer != null ? customer.getPhone() : "-", y);

                y = writeSection(content, "Vehicle", y - 12);
                y = writeRow(content, "Vehicle", car != null ? buildVehicleName(car) : "-", y);
                y = writeRow(content, "License plate", car != null ? car.getLicensePlate() : "-", y);
                y = writeRow(content, "Start time", formatDateTime(booking.getStartTime()), y);
                y = writeRow(content, "End time", formatDateTime(booking.getEndTime()), y);
                y = writeRow(content, "Free cancellation", freeCancellationText(booking), y);

                y = writeSection(content, "Payment", y - 12);
                BigDecimal baseRentalAmount = nonNull(booking.getBaseAmount());
                y = writeRow(content, "Base rental amount", formatMoney(baseRentalAmount) + " / " + baseRentalHours(booking), y);
                y = writeRow(content, "Extra services", formatMoney(nonNull(booking.getExtraServicesAmount())), y);
                y = writeRow(content, "Delivery fee", formatMoney(nonNull(booking.getDeliveryFeeAmount())), y);
                y = writeRow(content, "Reservation amount", formatMoney(booking.getDepositAmount()) + " (included in base rental amount)", y);
                y = writeRow(content, "Reservation paid at", paymentPaidAt(reservationPayment), y);
                y = writeRow(content, "Reservation gateway", paymentGateway(reservationPayment), y);
                y = writeRow(content, "Reservation transaction id", paymentTransactionId(reservationPayment), y);
                y = writeRow(content, "Overdue amount", formatMoney(nonNull(booking.getOverdueFee())), y);
                y = writeRow(content, "Penalty amount", formatMoney(nonNull(booking.getPenaltyOverdueFee())), y);
                y = writeRow(content, "Total rental amount", formatMoney(booking.getTotalAmount()), y);
                y = writeRow(content, "Total rental paid at", paymentPaidAt(finalRentalPayment), y);
                y = writeRow(content, "Final payment gateway", paymentGateway(finalRentalPayment), y);
                y = writeRow(content, "Final transaction id", paymentTransactionId(finalRentalPayment), y);

                writeFooter(content);
            }

            document.save(output);
            return output.toByteArray();
        }
    }

    private float writeTitle(PDPageContentStream content, String text, float y) throws IOException {
        content.beginText();
        content.setFont(PDType1Font.HELVETICA_BOLD, 22);
        content.newLineAtOffset(56, y);
        content.showText(safe(text));
        content.endText();
        return y - 30;
    }

    private float writeSection(PDPageContentStream content, String text, float y) throws IOException {
        content.beginText();
        content.setFont(PDType1Font.HELVETICA_BOLD, 14);
        content.newLineAtOffset(56, y);
        content.showText(safe(text));
        content.endText();
        return y - 22;
    }

    private float writeLine(PDPageContentStream content, String text, float y) throws IOException {
        content.beginText();
        content.setFont(PDType1Font.HELVETICA, 10);
        content.newLineAtOffset(56, y);
        content.showText(safe(text));
        content.endText();
        return y - 16;
    }

    private float writeRow(PDPageContentStream content, String label, String value, float y) throws IOException {
        content.beginText();
        content.setFont(PDType1Font.HELVETICA_BOLD, 10);
        content.newLineAtOffset(72, y);
        content.showText(safe(label + ":"));
        content.endText();

        content.beginText();
        content.setFont(PDType1Font.HELVETICA, 10);
        content.newLineAtOffset(210, y);
        content.showText(safe(value));
        content.endText();
        return y - 17;
    }

    private float writeSeparator(PDPageContentStream content, float y) throws IOException {
        content.moveTo(56, y);
        content.lineTo(540, y);
        content.stroke();
        return y;
    }

    private void writeFooter(PDPageContentStream content) throws IOException {
        content.beginText();
        content.setFont(PDType1Font.HELVETICA_OBLIQUE, 9);
        content.newLineAtOffset(56, 42);
        content.showText("Please keep this invoice for booking and payment reconciliation.");
        content.endText();
    }

    private String buildVehicleName(Car car) {
        return (car.getBrand() + " " + car.getModel()).trim();
    }

    private String freeCancellationText(Booking booking) {
        if (booking.getCreatedAt() != null
                && booking.getStartTime() != null
                && Duration.between(booking.getCreatedAt(), booking.getStartTime()).compareTo(Duration.ofHours(24)) < 0) {
            return "Not available - booking was created less than 24 hours before pick-up";
        }
        return "Until " + formatDateTime(booking.getFreeCancelUntil());
    }

    private String baseRentalHours(Booking booking) {
        if (booking.getStartTime() == null || booking.getEndTime() == null) {
            return "-";
        }
        long minutes = Duration.between(booking.getStartTime(), booking.getEndTime()).toMinutes();
        long hours = Math.max(1L, (minutes + 59L) / 60L);
        return hours + " hour" + (hours == 1L ? "" : "s");
    }

    private BigDecimal bookedSubtotal(Booking booking) {
        return nonNull(booking.getBaseAmount())
                .add(nonNull(booking.getExtraServicesAmount()))
                .add(nonNull(booking.getDeliveryFeeAmount()));
    }

    private BigDecimal nonNull(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private String paymentGateway(Payment payment) {
        return payment != null && payment.getGateway() != null ? payment.getGateway().name() : "-";
    }

    private String paymentTransactionId(Payment payment) {
        return payment != null && payment.getGatewayTransactionId() != null ? payment.getGatewayTransactionId() : "-";
    }

    private String paymentPaidAt(Payment payment) {
        return payment != null && payment.getPaidAt() != null ? formatDateTime(payment.getPaidAt()) : "-";
    }

    private String formatDateTime(java.time.LocalDateTime value) {
        return value != null ? value.format(DATE_TIME_FORMAT) : "-";
    }

    private String formatMoney(BigDecimal value) {
        if (value == null) {
            return "-";
        }
        return MONEY_FORMAT.format(value) + " VND";
    }

    private String safe(String value) {
        if (value == null || value.isBlank()) {
            return "-";
        }
        return value.replaceAll("[^\\x20-\\x7E]", "?");
    }

    private boolean isStaffOrAdmin(User user) {
        return user.getRole() == Role.ADMIN || user.getRole() == Role.STAFF;
    }
}
