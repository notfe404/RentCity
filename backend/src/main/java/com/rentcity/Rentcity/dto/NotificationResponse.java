package com.rentcity.Rentcity.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.rentcity.Rentcity.entity.NotificationAudience;
import com.rentcity.Rentcity.entity.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {

    private Long id;
    private Long recipientUserId;
    private NotificationAudience audience;
    private NotificationType type;
    private String title;
    private String message;
    private String body;
    private Map<String, String> data;
    @JsonProperty("isRead")
    private boolean isRead;
    private LocalDateTime readAt;
    private LocalDateTime createdAt;
}
