package com.rentcity.Rentcity.service;

import com.rentcity.Rentcity.dto.CarConditionResponse;
import com.rentcity.Rentcity.entity.Booking;
import com.rentcity.Rentcity.entity.Car;
import com.rentcity.Rentcity.entity.Payment;
import com.rentcity.Rentcity.entity.PaymentGateway;
import com.rentcity.Rentcity.entity.PaymentType;
import com.rentcity.Rentcity.entity.RentalContract;
import com.rentcity.Rentcity.entity.RentalContractStatus;
import com.rentcity.Rentcity.entity.SecurityDepositStatus;
import com.rentcity.Rentcity.entity.SettlementMethod;
import com.rentcity.Rentcity.entity.User;
import com.rentcity.Rentcity.entity.VehiclePickupMethod;
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
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.Duration;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class RentalContractPdfService {

    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final RentalContractService contractService;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final CarRepository carRepository;
    private final PaymentRepository paymentRepository;
    private final FileStorageService fileStorageService;
    private final CarConditionService carConditionService;

    @Transactional(readOnly = true)
    public byte[] generate(String email, Long bookingId) {
        RentalContract contract = contractService.findAuthorizedContract(email, bookingId);
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("booking", bookingId));
        User customer = userRepository.findById(booking.getUserId()).orElse(null);
        Car car = carRepository.findById(booking.getCarId()).orElse(null);
        Payment reservationPayment = paymentRepository
                .findFirstByBookingIdAndTypeOrderByCreatedAtDesc(bookingId, PaymentType.DEPOSIT)
                .orElse(null);
        Payment finalRentalPayment = paymentRepository
                .findFirstByBookingIdAndTypeOrderByCreatedAtDesc(bookingId, PaymentType.FINAL_RENTAL_PAYMENT)
                .orElse(null);

        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream output = new ByteArrayOutputStream();
             InputStream fontStream = getClass().getResourceAsStream("/fonts/DejaVuSans.ttf")) {
            if (fontStream == null) {
                throw new IllegalStateException("Bundled PDF font is missing");
            }

            PDType0Font font = PDType0Font.load(document, fontStream, true);
            PageWriter writer = new PageWriter(document, font, contract.getContractNumber());
            writer.title("RENTCITY VEHICLE RENTAL CONTRACT");
            writer.row("Contract number", contract.getContractNumber());
            writer.row("Contract status", enumText(contract.getStatus()));
            writer.row("Policy version", contract.getPolicyVersion());

            writer.section("BOOKING AND PARTIES");
            writer.row("Booking code", booking.getBookingCode());
            writer.row("Booking status", enumText(booking.getStatus()));
            writer.row("Reservation status", enumText(booking.getDepositStatus()));
            writer.row("Created at", format(booking.getCreatedAt()));
            writer.row("Customer", customer != null ? customer.getFullName() : "-");
            writer.row("Email", customer != null ? customer.getEmail() : "-");
            writer.row("Phone", customer != null ? customer.getPhone() : "-");
            writer.row("Vehicle", car != null ? car.getBrand() + " " + car.getModel() : "-");
            writer.row("License plate", car != null ? car.getLicensePlate() : "-");
            writer.row("Rental period", format(booking.getStartTime()) + " to " + format(booking.getEndTime()));
            writer.row("Pickup method", pickupMethod(booking));
            if (booking.getPickupMethod() == VehiclePickupMethod.ADDRESS_DELIVERY) {
                writer.row("Delivery address", booking.getDeliveryAddress());
            }
            writer.row("Free cancellation", freeCancellationText(booking));

            writer.section("PAYMENT SUMMARY");
            writer.row("Base rental amount", money(nonNull(booking.getBaseAmount())));
            writer.row("Base rental hours", baseRentalHours(booking));
            writer.row("Extra services", money(nonNull(booking.getExtraServicesAmount())));
            writer.row("Delivery fee", money(nonNull(booking.getDeliveryFeeAmount())));
            writer.row("Reservation amount", money(booking.getDepositAmount()) + " (included in base rental amount)");
            writer.row("Reservation paid at", paymentPaidAt(reservationPayment));
            writer.row("Reservation gateway", paymentMethod(paymentGateway(reservationPayment)));
            writer.row("Reservation transaction id", paymentTransactionId(reservationPayment));
            writer.row("Vehicle security deposit", money(booking.getSecurityDepositAmount()));
            writer.row("Overdue amount", money(nonNull(booking.getOverdueFee())));
            writer.row("Penalty amount", money(nonNull(booking.getPenaltyOverdueFee())));
            writer.row("Total rental amount", money(booking.getTotalAmount()));
            writer.row("Total rental paid at", paymentPaidAt(finalRentalPayment));
            writer.row("Final payment gateway", paymentMethod(paymentGateway(finalRentalPayment)));
            writer.row("Final transaction id", paymentTransactionId(finalRentalPayment));

            writer.section("RENTAL TERMS");
            for (String paragraph : contract.getPolicyText().split("\\R+")) {
                if (!paragraph.isBlank()) {
                    writer.paragraph(displayText(paragraph.trim()));
                }
            }

            writer.pageBreak();
            writer.section("VEHICLE HANDOVER RECORD");
            writer.row("Handover time", format(contract.getHandoverAt()));
            writer.row("Security deposit collected", money(contract.getSecurityDepositAmount()));
            writer.row("Security deposit method", paymentMethod(contract.getSecurityDepositGateway()));
            writer.row("Security deposit paid at", format(contract.getSecurityDepositPaidAt()));
            writeCondition(writer, carConditionService.getById(contract.getHandoverConditionReportId()));
            writer.row("Keys", String.valueOf(contract.getHandoverKeyCount()));
            writer.row("Accessories", contract.getHandoverAccessories());
            writer.row("Customer signed at", format(contract.getHandoverCustomerSignedAt()));
            writer.row("Staff signed at", format(contract.getHandoverStaffSignedAt()));
            writer.signatures(
                    "Customer signature",
                    "Staff signature",
                    contract.getHandoverCustomerSignature(),
                    contract.getHandoverStaffSignature()
            );

            if (contract.getStatus() == RentalContractStatus.COMPLETED) {
                writer.pageBreak();
                writer.section("VEHICLE RETURN RECORD");
                if (contract.getSecurityDepositRepairCost() != null) {
                    writer.row("Actual repair cost", money(contract.getSecurityDepositRepairCost()));
                    writer.row("Security deposit refunded", money(contract.getSecurityDepositRefundedAmount()));
                }
                writer.row("Actual return time", format(booking.getActualReturnAt()));
                writeCondition(writer, carConditionService.getById(contract.getReturnConditionReportId()));
                writer.row("Returned keys", String.valueOf(contract.getReturnKeyCount()));
                writer.row("Returned accessories", contract.getReturnAccessories());
                writer.row("Overdue amount", money(nonNull(booking.getOverdueFee())));
                writer.row("Penalty amount", money(nonNull(booking.getPenaltyOverdueFee())));
                writer.row("Total overdue amount", money(nonNull(booking.getTotalOverdueFee())));
                writer.row("Final rental amount", money(contract.getFinalRentalAmount()));
                writer.row("Final payment method", finalPaymentMethodText(finalRentalPayment, contract.getFinalPaymentMethod()));
                writer.row("Final payment status", enumText(contract.getFinalPaymentStatus()));
                writer.row("Security deposit result", enumText(contract.getSecurityDepositStatus()));
                writer.row("Security deposit refund method", securityDepositRefundMethodText(contract.getSecurityDepositRefundMethod()));
                writer.row("Security deposit resolved at", format(contract.getSecurityDepositResolvedAt()));
                writer.row("Security deposit note", contract.getSecurityDepositStatus() == SecurityDepositStatus.RETAINED
                        ? "The security deposit is retained for repair or maintenance."
                        : "The security deposit has been refunded to the customer.");
                writer.row("Outstanding amount", money(booking.getOutstandingAmount()));
                writer.row("Customer signed at", format(contract.getReturnCustomerSignedAt()));
                writer.row("Staff signed at", format(contract.getReturnStaffSignedAt()));
                writer.signatures(
                        "Customer signature",
                        "Staff signature",
                        contract.getReturnCustomerSignature(),
                        contract.getReturnStaffSignature()
                );
            }

            writer.close();
            document.save(output);
            return output.toByteArray();
        } catch (IOException ex) {
            throw new IllegalStateException("Cannot generate rental contract PDF", ex);
        }
    }

    private void writeCondition(PageWriter writer, CarConditionResponse condition) throws IOException {
        if (condition == null) {
            writer.row("Vehicle condition", "-");
            return;
        }
        writer.row("Vehicle condition", enumText(condition.getCondition()));
        writer.row("Damage recorded", condition.isDamageFound() ? "Yes" : "No");
        writer.row("Condition notes", condition.getNotes());
    }

    private String pickupMethod(Booking booking) {
        return booking.getPickupMethod() == VehiclePickupMethod.ADDRESS_DELIVERY
                ? "Delivery to customer address"
                : "Pickup at branch";
    }

    private String freeCancellationText(Booking booking) {
        if (booking.getCreatedAt() != null
                && booking.getStartTime() != null
                && Duration.between(booking.getCreatedAt(), booking.getStartTime()).compareTo(Duration.ofHours(24)) < 0) {
            return "Not available - booking was created less than 24 hours before pick-up";
        }
        return "Until " + format(booking.getFreeCancelUntil());
    }

    private String baseRentalHours(Booking booking) {
        if (booking.getStartTime() == null || booking.getEndTime() == null) {
            return "-";
        }
        long minutes = Duration.between(booking.getStartTime(), booking.getEndTime()).toMinutes();
        long hours = Math.max(1L, (minutes + 59L) / 60L);
        return hours + " hour" + (hours == 1L ? "" : "s");
    }

    private String format(java.time.LocalDateTime value) {
        return value == null ? "-" : value.format(DATE_TIME);
    }

    private String money(BigDecimal value) {
        if (value == null) return "-";
        return NumberFormat.getIntegerInstance(Locale.US).format(value) + " VND";
    }

    private BigDecimal bookedSubtotal(Booking booking) {
        return nonNull(booking.getBaseAmount())
                .add(nonNull(booking.getExtraServicesAmount()))
                .add(nonNull(booking.getDeliveryFeeAmount()));
    }

    private BigDecimal nonNull(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private String enumText(Enum<?> value) {
        if (value == null) {
            return "-";
        }
        if ("NEED_MAINTENANCE".equals(value.name())) {
            return "Maintenance required";
        }
        String[] parts = value.name().toLowerCase(Locale.ROOT).split("_");
        StringBuilder label = new StringBuilder();
        for (String part : parts) {
            if (part.isBlank()) {
                continue;
            }
            if (!label.isEmpty()) {
                label.append(' ');
            }
            label.append(Character.toUpperCase(part.charAt(0))).append(part.substring(1));
        }
        return label.isEmpty() ? value.name() : label.toString();
    }

    private String displayText(String value) {
        if (value == null) {
            return null;
        }
        return value.replace("NEED_MAINTENANCE", "maintenance required");
    }

    private PaymentGateway paymentGateway(Payment payment) {
        return payment != null ? payment.getGateway() : null;
    }

    private String paymentTransactionId(Payment payment) {
        return payment != null && payment.getGatewayTransactionId() != null ? payment.getGatewayTransactionId() : "-";
    }

    private String paymentPaidAt(Payment payment) {
        return payment != null && payment.getPaidAt() != null ? format(payment.getPaidAt()) : "-";
    }

    private String paymentMethod(PaymentGateway gateway) {
        if (gateway == null) return "Online payment";
        return switch (gateway) {
            case PAYPAL -> "Online payment - PayPal";
            case VNPAY -> "Online payment - VNPay";
            case WALLET -> "Refund balance";
            case CASH -> "Cash";
        };
    }

    private String finalPaymentMethodText(Payment payment, SettlementMethod settlementMethod) {
        if (settlementMethod == SettlementMethod.CASH) {
            return "Cash";
        }
        PaymentGateway gateway = paymentGateway(payment);
        return gateway != null ? paymentMethod(gateway) : "Online payment request";
    }

    private String securityDepositRefundMethodText(SettlementMethod settlementMethod) {
        if (settlementMethod == SettlementMethod.CASH) {
            return "Cash";
        }
        if (settlementMethod == SettlementMethod.PAYMENT_REQUEST) {
            return "Refund balance";
        }
        return "-";
    }

    private class PageWriter {
        private static final float LEFT = 52;
        private static final float RIGHT = 543;
        private static final float VALUE_X = 205;

        private final PDDocument document;
        private final PDType0Font font;
        private final String contractNumber;
        private PDPageContentStream content;
        private float y;
        private int pageNumber;

        PageWriter(PDDocument document, PDType0Font font, String contractNumber) throws IOException {
            this.document = document;
            this.font = font;
            this.contractNumber = contractNumber;
            newPage();
        }

        void title(String value) throws IOException {
            ensure(52);
            content.setNonStrokingColor(33, 37, 41);
            content.addRect(LEFT, y - 18, RIGHT - LEFT, 46);
            content.fill();
            text(value, 19, LEFT + 18, y, 255, 255, 255);
            y -= 42;
        }

        void section(String value) throws IOException {
            ensure(40);
            y -= 8;
            content.setNonStrokingColor(120, 173, 68);
            content.addRect(LEFT, y - 4, 4, 18);
            content.fill();
            text(value, 13, LEFT + 12, y, 33, 37, 41);
            y -= 25;
        }

        void row(String label, String value) throws IOException {
            String cleanValue = safe(value);
            List<String> valueLines = wrap(cleanValue, RIGHT - VALUE_X, 9);
            if (valueLines.isEmpty()) valueLines = List.of("-");
            float rowHeight = Math.max(18, valueLines.size() * 13 + 3);
            ensure(rowHeight);

            text(label + ":", 9, LEFT + 10, y, 90, 99, 106);
            for (int index = 0; index < valueLines.size(); index++) {
                text(valueLines.get(index), 9, VALUE_X, y - index * 13, 33, 37, 41);
            }
            y -= rowHeight;
        }

        void paragraph(String value) throws IOException {
            for (String line : wrap(safe(value), RIGHT - LEFT - 20, 9)) {
                ensure(16);
                text(line, 9, LEFT + 10, y, 73, 80, 87);
                y -= 13;
            }
            y -= 6;
        }

        void signatures(String customerLabel, String staffLabel, String customerPath, String staffPath) throws IOException {
            ensure(110);
            text(customerLabel, 9, 72, y, 73, 80, 87);
            text(staffLabel, 9, 320, y, 73, 80, 87);
            float boxY = y - 72;
            drawSignatureBox(72, boxY, customerPath);
            drawSignatureBox(320, boxY, staffPath);
            y = boxY - 18;
        }

        void pageBreak() throws IOException {
            newPage();
        }

        void close() throws IOException {
            if (content != null) content.close();
        }

        private void newPage() throws IOException {
            if (content != null) content.close();
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);
            content = new PDPageContentStream(document, page);
            pageNumber++;
            y = 790;

            text("RENTCITY", 10, LEFT, 816, 86, 131, 45);
            text("Contract " + contractNumber, 8, 205, 816, 108, 117, 125);
            text("Page " + pageNumber, 8, 500, 816, 108, 117, 125);
            content.setStrokingColor(224, 229, 233);
            content.moveTo(LEFT, 807);
            content.lineTo(RIGHT, 807);
            content.stroke();

            content.moveTo(LEFT, 42);
            content.lineTo(RIGHT, 42);
            content.stroke();
            text("RentCity - Electronic rental contract stored with the booking", 7.5f, LEFT, 28, 108, 117, 125);
        }

        private void ensure(float height) throws IOException {
            if (y - height < 58) newPage();
        }

        private void text(String value, float size, float x, float atY, int red, int green, int blue) throws IOException {
            content.beginText();
            content.setNonStrokingColor(red, green, blue);
            content.setFont(font, size);
            content.newLineAtOffset(x, atY);
            content.showText(safe(value));
            content.endText();
        }

        private void drawSignatureBox(float x, float atY, String path) throws IOException {
            content.setStrokingColor(210, 216, 221);
            content.addRect(x, atY, 170, 60);
            content.stroke();
            drawImage(path, x + 5, atY + 5, 160, 50);
        }

        private void drawImage(String path, float x, float atY, float maxWidth, float maxHeight) {
            try {
                byte[] bytes = fileStorageService.read(path);
                PDImageXObject image = PDImageXObject.createFromByteArray(document, bytes, "signature");
                float scale = Math.min(maxWidth / image.getWidth(), maxHeight / image.getHeight());
                float width = image.getWidth() * scale;
                float height = image.getHeight() * scale;
                content.drawImage(image, x + (maxWidth - width) / 2, atY + (maxHeight - height) / 2, width, height);
            } catch (Exception ignored) {
                // Signing timestamps remain available if a legacy signature file is missing.
            }
        }

        private List<String> wrap(String value, float maxWidth, float fontSize) throws IOException {
            List<String> lines = new ArrayList<>();
            StringBuilder line = new StringBuilder();
            for (String word : value.split("\\s+")) {
                String candidate = line.isEmpty() ? word : line + " " + word;
                float width = font.getStringWidth(candidate) / 1000f * fontSize;
                if (!line.isEmpty() && width > maxWidth) {
                    lines.add(line.toString());
                    line.setLength(0);
                    line.append(word);
                } else {
                    if (!line.isEmpty()) line.append(' ');
                    line.append(word);
                }
            }
            if (!line.isEmpty()) lines.add(line.toString());
            return lines;
        }

        private String safe(String value) {
            if (value == null || value.isBlank()) return "-";
            return value.replaceAll("[\\p{Cc}\\p{Cf}]", " ").replaceAll("\\s+", " ").trim();
        }
    }
}
