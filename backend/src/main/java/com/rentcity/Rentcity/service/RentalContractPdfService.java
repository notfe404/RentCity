package com.rentcity.Rentcity.service;

import com.rentcity.Rentcity.dto.CarConditionResponse;
import com.rentcity.Rentcity.entity.*;
import com.rentcity.Rentcity.exception.ResourceNotFoundException;
import com.rentcity.Rentcity.repository.BookingRepository;
import com.rentcity.Rentcity.repository.CarRepository;
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
    private final FileStorageService fileStorageService;
    private final CarConditionService carConditionService;

    @Transactional(readOnly = true)
    public byte[] generate(String email, Long bookingId) {
        RentalContract contract = contractService.findAuthorizedContract(email, bookingId);
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("booking", bookingId));
        User customer = userRepository.findById(booking.getUserId()).orElse(null);
        Car car = carRepository.findById(booking.getCarId()).orElse(null);

        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream output = new ByteArrayOutputStream();
             InputStream fontStream = getClass().getResourceAsStream("/fonts/DejaVuSans.ttf")) {
            if (fontStream == null) {
                throw new IllegalStateException("Bundled Vietnamese PDF font is missing");
            }

            PDType0Font font = PDType0Font.load(document, fontStream, true);
            PageWriter writer = new PageWriter(document, font, contract.getContractNumber());
            writer.title("HỢP ĐỒNG THUÊ XE RENTCITY");
            writer.row("Mã hợp đồng", contract.getContractNumber());
            writer.row("Trạng thái", contract.getStatus().name().replace('_', ' '));
            writer.row("Phiên bản điều khoản", contract.getPolicyVersion());

            writer.section("THÔNG TIN ĐẶT XE VÀ CÁC BÊN");
            writer.row("Mã booking", booking.getBookingCode());
            writer.row("Khách hàng", customer != null ? customer.getFullName() : "-");
            writer.row("Email", customer != null ? customer.getEmail() : "-");
            writer.row("Số điện thoại", customer != null ? customer.getPhone() : "-");
            writer.row("Xe", car != null ? car.getBrand() + " " + car.getModel() : "-");
            writer.row("Biển số", car != null ? car.getLicensePlate() : "-");
            writer.row("Thời gian thuê", format(booking.getStartTime()) + " đến " + format(booking.getEndTime()));
            writer.row("Hình thức nhận xe", pickupMethod(booking));
            if (booking.getPickupMethod() == VehiclePickupMethod.ADDRESS_DELIVERY) {
                writer.row("Địa chỉ giao xe", booking.getDeliveryAddress());
            }
            writer.row("Tiền thuê cơ bản", money(booking.getBaseAmount()));
            writer.row("Dịch vụ bổ sung", money(booking.getExtraServicesAmount()));
            writer.row("Phí giao xe", money(booking.getDeliveryFeeAmount()));
            writer.row("Phí giữ chỗ (30%)", money(booking.getDepositAmount()));
            writer.row("Tiền cọc thuê xe", money(booking.getSecurityDepositAmount()));
            writer.row("Tổng hiện tại", money(booking.getTotalAmount()));

            writer.section("ĐIỀU KHOẢN THUÊ XE");
            for (String paragraph : contract.getPolicyText().split("\\R+")) {
                if (!paragraph.isBlank()) {
                    writer.paragraph(paragraph.trim());
                }
            }

            writer.pageBreak();
            writer.section("BIÊN BẢN BÀN GIAO XE");
            writer.row("Thời gian bàn giao", format(contract.getHandoverAt()));
            writer.row("Tiền cọc đã thu", money(contract.getSecurityDepositAmount()));
            writer.row("Hình thức thu cọc", enumText(contract.getSecurityDepositCollectionMethod()));
            writer.row("Thời gian thu cọc", format(contract.getSecurityDepositPaidAt()));
            writeCondition(writer, carConditionService.getById(contract.getHandoverConditionReportId()));
            writer.row("Số chìa khóa", String.valueOf(contract.getHandoverKeyCount()));
            writer.row("Phụ kiện", contract.getHandoverAccessories());
            writer.row("Khách hàng ký lúc", format(contract.getHandoverCustomerSignedAt()));
            writer.row("Nhân viên ký lúc", format(contract.getHandoverStaffSignedAt()));
            writer.signatures(
                    "Chữ ký khách hàng",
                    "Chữ ký nhân viên",
                    contract.getHandoverCustomerSignature(),
                    contract.getHandoverStaffSignature()
            );

            if (contract.getStatus() == RentalContractStatus.COMPLETED) {
                writer.pageBreak();
                writer.section("BIÊN BẢN TRẢ XE");
                writer.row("Thời gian trả thực tế", format(booking.getActualReturnAt()));
                writeCondition(writer, carConditionService.getById(contract.getReturnConditionReportId()));
                writer.row("Số chìa khóa", String.valueOf(contract.getReturnKeyCount()));
                writer.row("Phụ kiện", contract.getReturnAccessories());
                writer.row("Phí quá hạn", money(booking.getTotalOverdueFee()));
                writer.row("Tiền còn lại sau phí giữ chỗ", money(bookedSubtotal(booking).subtract(booking.getDepositAmount())));
                writer.row("Tổng thanh toán khi trả xe", money(contract.getFinalRentalAmount()));
                writer.row("Hình thức thanh toán", enumText(contract.getFinalPaymentMethod()));
                writer.row("Trạng thái thanh toán", enumText(contract.getFinalPaymentStatus()));
                writer.row("Xử lý tiền cọc", enumText(contract.getSecurityDepositStatus()));
                writer.row("Hình thức hoàn cọc", enumText(contract.getSecurityDepositRefundMethod()));
                writer.row("Thời gian xử lý cọc", format(contract.getSecurityDepositResolvedAt()));
                writer.row("Ghi chú tiền cọc", contract.getSecurityDepositStatus() == SecurityDepositStatus.RETAINED
                        ? "Tiền cọc được giữ lại để sửa chữa hoặc bảo dưỡng xe."
                        : "Tiền cọc đã được hoàn lại cho khách hàng.");
                writer.row("Số tiền còn thiếu", money(booking.getOutstandingAmount()));
                writer.row("Khách hàng ký lúc", format(contract.getReturnCustomerSignedAt()));
                writer.row("Nhân viên ký lúc", format(contract.getReturnStaffSignedAt()));
                writer.signatures(
                        "Chữ ký khách hàng",
                        "Chữ ký nhân viên",
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
            writer.row("Tình trạng xe", "-");
            return;
        }
        writer.row("Tình trạng xe", condition.getCondition().name().replace('_', ' '));
        writer.row("Số km", condition.getOdometer() + " km");
        writer.row("Mức nhiên liệu", condition.getFuelLevel() + "%");
        writer.row("Ghi nhận hư hỏng", condition.isDamageFound() ? "Có" : "Không");
        writer.row("Ghi chú", condition.getNotes());
    }

    private String pickupMethod(Booking booking) {
        return booking.getPickupMethod() == VehiclePickupMethod.ADDRESS_DELIVERY
                ? "Giao xe tận địa chỉ"
                : "Nhận xe tại chi nhánh";
    }

    private String format(java.time.LocalDateTime value) {
        return value == null ? "-" : value.format(DATE_TIME);
    }

    private String money(BigDecimal value) {
        if (value == null) return "-";
        return NumberFormat.getIntegerInstance(new Locale("vi", "VN")).format(value) + " VND";
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
        return value == null ? "-" : value.name().replace('_', ' ');
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
            text("Hợp đồng " + contractNumber, 8, 205, 816, 108, 117, 125);
            text("Trang " + pageNumber, 8, 500, 816, 108, 117, 125);
            content.setStrokingColor(224, 229, 233);
            content.moveTo(LEFT, 807);
            content.lineTo(RIGHT, 807);
            content.stroke();

            content.moveTo(LEFT, 42);
            content.lineTo(RIGHT, 42);
            content.stroke();
            text("RentCity - Biên bản điện tử được lưu cùng booking", 7.5f, LEFT, 28, 108, 117, 125);
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
