package com.rentcity.Rentcity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserDocumentResponse {
    private Long id;
    private Long userId;
    private String docType;
    private String docNumber;
    private String frontUrl;
    private String backUrl;
    private boolean verified;
    private LocalDateTime createdAt;
}

