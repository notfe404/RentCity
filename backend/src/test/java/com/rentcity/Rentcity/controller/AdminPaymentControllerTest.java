package com.rentcity.Rentcity.controller;

import com.rentcity.Rentcity.dto.PaymentResponse;
import com.rentcity.Rentcity.service.PaymentService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminPaymentControllerTest {

    @Mock
    private PaymentService paymentService;

    @Mock
    private Authentication authentication;

    @Test
    void refundRouteDelegatesUsingAuthenticatedAdmin() throws Exception {
        PaymentResponse refundedPayment = PaymentResponse.builder().id(15L).build();
        when(authentication.getName()).thenReturn("admin@demo.com");
        when(paymentService.refundPayment("admin@demo.com", 15L)).thenReturn(refundedPayment);
        AdminPaymentController controller = new AdminPaymentController(paymentService);

        var response = controller.refundPayment(authentication, 15L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertSame(refundedPayment, response.getBody());
        verify(paymentService).refundPayment("admin@demo.com", 15L);

        Method method = AdminPaymentController.class.getMethod("refundPayment", Authentication.class, Long.class);
        assertArrayEquals(new String[]{"/{id}/refund"}, method.getAnnotation(PostMapping.class).value());
    }
}
