package com.rentcity.Rentcity.service;

import com.rentcity.Rentcity.dto.HandoverContractRequest;
import com.rentcity.Rentcity.dto.CarConditionResponse;
import com.rentcity.Rentcity.dto.ReturnContractRequest;
import com.rentcity.Rentcity.entity.*;
import com.rentcity.Rentcity.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RentalContractServiceTest {

    @Mock RentalContractRepository contractRepository;
    @Mock BookingRepository bookingRepository;
    @Mock UserRepository userRepository;
    @Mock CarRepository carRepository;
    @Mock CarConditionService carConditionService;
    @Mock FileStorageService fileStorageService;
    @Mock BookingStateMachineService bookingStateMachineService;
    @Mock NotificationService notificationService;
    @Mock OverdueFeeService overdueFeeService;
    @Mock WalletService walletService;
    @Mock DamageAssessmentService damageAssessmentService;
    @Mock PaymentRepository paymentRepository;

    @InjectMocks RentalContractService service;

    private User staff;
    private Booking booking;
    private Car car;
    private MockMultipartFile photo;
    private MockMultipartFile customerSignature;
    private MockMultipartFile staffSignature;

    @BeforeEach
    void setUp() {
        staff = User.builder().id(7L).email("staff@rentcity.test").role(Role.STAFF).build();
        booking = Booking.builder()
                .id(10L)
                .bookingCode("RC-TEST")
                .userId(20L)
                .carId(30L)
                .startTime(LocalDateTime.now().minusHours(1))
                .endTime(LocalDateTime.now().plusDays(1))
                .createdAt(LocalDateTime.now().minusDays(1))
                .status(BookingStatus.PAID)
                .depositStatus(DepositStatus.PAID)
                .securityDepositAmount(BigDecimal.valueOf(5_000_000))
                .securityDepositPaidAmount(BigDecimal.valueOf(5_000_000))
                .securityDepositStatus(SecurityDepositStatus.PAID)
                .securityDepositCollectionMethod(SettlementMethod.PAYMENT_REQUEST)
                .securityDepositPaidAt(LocalDateTime.now().minusMinutes(10))
                .baseAmount(BigDecimal.valueOf(1_000_000))
                .depositAmount(BigDecimal.valueOf(300_000))
                .totalAmount(BigDecimal.valueOf(1_000_000))
                .build();
        car = Car.builder()
                .id(30L)
                .brand("Toyota")
                .model("Vios")
                .licensePlate("51A-12345")
                .pricePerDay(BigDecimal.valueOf(800_000))
                .status(CarStatus.AVAILABLE)
                .build();
        photo = new MockMultipartFile("files", "car.png", "image/png", new byte[]{1});
        customerSignature = new MockMultipartFile("customerSignature", "customer.png", "image/png", new byte[]{2});
        staffSignature = new MockMultipartFile("staffSignature", "staff.png", "image/png", new byte[]{3});
    }

    @Test
    void completeHandoverSavesContractAndStartsBooking() {
        HandoverContractRequest request = validRequest();
        CarConditionReport report = CarConditionReport.builder().id(40L).build();

        when(userRepository.findByEmail(staff.getEmail())).thenReturn(Optional.of(staff));
        when(bookingRepository.findByIdForUpdate(booking.getId())).thenReturn(Optional.of(booking));
        when(contractRepository.findByBookingId(booking.getId())).thenReturn(Optional.empty());
        when(carRepository.findByIdForUpdate(car.getId())).thenReturn(Optional.of(car));
        when(carConditionService.createHandover(eq(car.getId()), eq(booking.getId()), any(), eq(staff.getId()), eq(Role.STAFF), anyList()))
                .thenReturn(report);
        when(fileStorageService.storePrivate(customerSignature, "contracts/signatures")).thenReturn("private:contracts/customer.png");
        when(fileStorageService.storePrivate(staffSignature, "contracts/signatures")).thenReturn("private:contracts/staff.png");
        when(contractRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        var result = service.completeHandover(
                staff.getEmail(), booking.getId(), request, List.of(photo), customerSignature, staffSignature
        );

        assertEquals(RentalContractStatus.ACTIVE, result.getStatus());
        ArgumentCaptor<RentalContract> contractCaptor = ArgumentCaptor.forClass(RentalContract.class);
        verify(contractRepository).save(contractCaptor.capture());
        assertEquals(40L, contractCaptor.getValue().getHandoverConditionReportId());
        assertEquals("private:contracts/customer.png", contractCaptor.getValue().getHandoverCustomerSignature());
        assertEquals(RentalContractService.POLICY_VERSION, contractCaptor.getValue().getPolicyVersion());
        verify(bookingStateMachineService).transition(
                eq(booking), eq(BookingStatus.ONGOING), eq(staff.getId()), eq(Role.STAFF), eq("SIGNED_HANDOVER"), anyString()
        );
        verify(bookingRepository).save(booking);
        verify(notificationService).notifyBookingStatusChanged(booking, BookingStatus.ONGOING);
    }

    @Test
    void completeHandoverRequiresBothSignatures() {
        when(userRepository.findByEmail(staff.getEmail())).thenReturn(Optional.of(staff));
        when(bookingRepository.findByIdForUpdate(booking.getId())).thenReturn(Optional.of(booking));
        when(contractRepository.findByBookingId(booking.getId())).thenReturn(Optional.empty());

        IllegalArgumentException error = assertThrows(IllegalArgumentException.class, () ->
                service.completeHandover(staff.getEmail(), booking.getId(), validRequest(), List.of(photo), null, staffSignature)
        );

        assertEquals("Customer signature is required", error.getMessage());
        verifyNoInteractions(carConditionService);
    }

    @Test
    void completeHandoverRejectsTimeBeforeBookingCreation() {
        HandoverContractRequest request = validRequest();
        request.setActualHandoverAt(booking.getCreatedAt().minusMinutes(1));
        when(userRepository.findByEmail(staff.getEmail())).thenReturn(Optional.of(staff));
        when(bookingRepository.findByIdForUpdate(booking.getId())).thenReturn(Optional.of(booking));
        when(contractRepository.findByBookingId(booking.getId())).thenReturn(Optional.empty());

        IllegalArgumentException error = assertThrows(IllegalArgumentException.class, () ->
                service.completeHandover(
                        staff.getEmail(), booking.getId(), request, List.of(photo), customerSignature, staffSignature
                )
        );

        assertEquals("Handover time cannot be before the booking was created", error.getMessage());
        verifyNoInteractions(carRepository, carConditionService);
    }

    @Test
    void completeReturnFinalizesContractBookingAndVehicle() {
        booking.setStatus(BookingStatus.ONGOING);
        RentalContract contract = RentalContract.builder()
                .id(50L)
                .bookingId(booking.getId())
                .contractNumber("RC-CON-TEST")
                .policyVersion("1.0")
                .policyText("Policy")
                .handoverConditionReportId(40L)
                .handoverAt(booking.getStartTime().minusMinutes(30))
                .status(RentalContractStatus.ACTIVE)
                .build();
        CarConditionResponse handover = CarConditionResponse.builder()
                .id(40L)
                .odometer(20_000L)
                .fuelLevel(100)
                .condition(CarCondition.GOOD)
                .build();
        ReturnContractRequest request = new ReturnContractRequest();
        request.setActualReturnAt(LocalDateTime.now());
        request.setCondition(CarCondition.GOOD);
        request.setOdometer(20_250L);
        request.setFuelLevel(90);
        request.setKeyCount(1);
        request.setAccessories("Documents and spare tire");
        request.setFinalPaymentMethod(SettlementMethod.CASH);
        request.setSecurityDepositRefundMethod(SettlementMethod.PAYMENT_REQUEST);

        when(userRepository.findByEmail(staff.getEmail())).thenReturn(Optional.of(staff));
        when(bookingRepository.findByIdForUpdate(booking.getId())).thenReturn(Optional.of(booking));
        when(contractRepository.findByBookingId(booking.getId())).thenReturn(Optional.of(contract));
        when(carConditionService.getById(40L)).thenReturn(handover);
        when(carRepository.findByIdForUpdate(car.getId())).thenReturn(Optional.of(car));
        when(carConditionService.createReturn(eq(car.getId()), eq(booking.getId()), any(), eq(staff.getId()), eq(Role.STAFF), anyList()))
                .thenReturn(CarConditionReport.builder().id(41L).build());
        when(overdueFeeService.calculate(any(), any(), any(), any(), any(), any()))
                .thenReturn(new OverdueFeeService.OverdueCharge(0, 0, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO));
        when(fileStorageService.storePrivate(customerSignature, "contracts/signatures")).thenReturn("private:contracts/return-customer.png");
        when(fileStorageService.storePrivate(staffSignature, "contracts/signatures")).thenReturn("private:contracts/return-staff.png");
        when(contractRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        var result = service.completeReturn(
                staff.getEmail(), booking.getId(), request, List.of(photo), customerSignature, staffSignature
        );

        assertEquals(RentalContractStatus.COMPLETED, result.getStatus());
        assertEquals(CarStatus.AVAILABLE, car.getStatus());
        assertEquals(41L, contract.getReturnConditionReportId());
        assertEquals(SecurityDepositStatus.REFUNDED, booking.getSecurityDepositStatus());
        assertEquals(FinalPaymentStatus.PAID, booking.getFinalPaymentStatus());
        assertEquals(BigDecimal.valueOf(700_000), booking.getFinalRentalAmount());
        verify(walletService).refundBookingDeposit(
                eq(booking.getUserId()), eq(booking.getId()), eq(booking.getSecurityDepositAmount()),
                anyString(), anyString()
        );
        verify(bookingStateMachineService).transition(
                eq(booking), eq(BookingStatus.COMPLETED), eq(staff.getId()), eq(Role.STAFF), eq("SIGNED_RETURN"), any()
        );
        verify(notificationService).notifyBookingStatusChanged(booking, BookingStatus.COMPLETED);
    }

    @Test
    void damagedReturnRetainsSecurityDepositWithoutCreatingDamageFee() {
        booking.setStatus(BookingStatus.ONGOING);
        RentalContract contract = RentalContract.builder()
                .id(51L)
                .bookingId(booking.getId())
                .contractNumber("RC-CON-DAMAGE")
                .policyVersion("1.0")
                .policyText("Policy")
                .handoverConditionReportId(40L)
                .handoverAt(booking.getStartTime().minusMinutes(30))
                .status(RentalContractStatus.ACTIVE)
                .build();
        CarConditionResponse handover = CarConditionResponse.builder()
                .id(40L)
                .odometer(20_000L)
                .fuelLevel(100)
                .condition(CarCondition.GOOD)
                .build();
        ReturnContractRequest request = new ReturnContractRequest();
        request.setActualReturnAt(LocalDateTime.now());
        request.setCondition(CarCondition.DAMAGE);
        request.setDamageFound(true);
        request.setDamageSeverity(DamageSeverity.MINOR);
        request.setDamageDescription("Scratch on rear door");
        request.setOdometer(20_250L);
        request.setFuelLevel(90);
        request.setKeyCount(1);
        request.setAccessories("Documents and spare tire");
        request.setFinalPaymentMethod(SettlementMethod.PAYMENT_REQUEST);

        when(userRepository.findByEmail(staff.getEmail())).thenReturn(Optional.of(staff));
        when(bookingRepository.findByIdForUpdate(booking.getId())).thenReturn(Optional.of(booking));
        when(contractRepository.findByBookingId(booking.getId())).thenReturn(Optional.of(contract));
        when(carConditionService.getById(40L)).thenReturn(handover);
        when(carRepository.findByIdForUpdate(car.getId())).thenReturn(Optional.of(car));
        when(carConditionService.createReturn(eq(car.getId()), eq(booking.getId()), any(), eq(staff.getId()), eq(Role.STAFF), anyList()))
                .thenReturn(CarConditionReport.builder().id(42L).build());
        when(overdueFeeService.calculate(any(), any(), any(), any(), any(), any()))
                .thenReturn(new OverdueFeeService.OverdueCharge(0, 0, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO));
        when(fileStorageService.storePrivate(customerSignature, "contracts/signatures")).thenReturn("private:contracts/damage-customer.png");
        when(fileStorageService.storePrivate(staffSignature, "contracts/signatures")).thenReturn("private:contracts/damage-staff.png");
        when(contractRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        service.completeReturn(
                staff.getEmail(), booking.getId(), request, List.of(photo), customerSignature, staffSignature
        );

        assertEquals(SecurityDepositStatus.RETAINED, booking.getSecurityDepositStatus());
        assertEquals(BigDecimal.ZERO, booking.getDamageFee());
        assertEquals(CarStatus.MAINTENANCE, car.getStatus());
        assertEquals(FinalPaymentStatus.PAYMENT_REQUESTED, booking.getFinalPaymentStatus());
        verify(walletService).retainSecurityDeposit(eq(booking.getUserId()), eq(booking.getId()), anyString(), eq(staff.getId()));
        verifyNoInteractions(damageAssessmentService);
    }

    private HandoverContractRequest validRequest() {
        HandoverContractRequest request = new HandoverContractRequest();
        request.setActualHandoverAt(LocalDateTime.now());
        request.setCondition(CarCondition.GOOD);
        request.setOdometer(20_000L);
        request.setFuelLevel(100);
        request.setDamageFound(false);
        request.setKeyCount(1);
        request.setAccessories("Documents and spare tire");
        return request;
    }
}
