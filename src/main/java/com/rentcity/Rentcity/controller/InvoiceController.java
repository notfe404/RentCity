package com.rentcity.Rentcity.controller;

import com.rentcity.Rentcity.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    @GetMapping("/{bookingId}/pdf")
    public ResponseEntity<byte[]> downloadBookingInvoice(
            Authentication authentication,
            @PathVariable Long bookingId
    ) {
        byte[] pdf = invoiceService.generateBookingInvoice(authentication.getName(), bookingId);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename("rentcity-invoice-" + bookingId + ".pdf")
                                .build()
                                .toString()
                )
                .body(pdf);
    }
}
