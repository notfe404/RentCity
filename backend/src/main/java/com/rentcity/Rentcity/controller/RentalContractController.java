package com.rentcity.Rentcity.controller;

import com.rentcity.Rentcity.dto.RentalContractResponse;
import com.rentcity.Rentcity.service.RentalContractPdfService;
import com.rentcity.Rentcity.service.RentalContractService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/bookings")
@RequiredArgsConstructor
public class RentalContractController {

    private final RentalContractService rentalContractService;
    private final RentalContractPdfService rentalContractPdfService;

    @GetMapping("/{bookingId}/contract")
    public ResponseEntity<RentalContractResponse> getContract(
            Authentication authentication,
            @PathVariable Long bookingId
    ) {
        return ResponseEntity.ok(rentalContractService.getForActor(authentication.getName(), bookingId));
    }

    @GetMapping("/{bookingId}/contract/pdf")
    public ResponseEntity<byte[]> downloadContract(
            Authentication authentication,
            @PathVariable Long bookingId
    ) {
        byte[] pdf = rentalContractPdfService.generate(authentication.getName(), bookingId);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=rentcity-contract-" + bookingId + ".pdf")
                .body(pdf);
    }
}
