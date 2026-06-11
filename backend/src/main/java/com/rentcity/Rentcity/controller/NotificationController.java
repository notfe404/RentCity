package com.rentcity.Rentcity.controller;

import com.rentcity.Rentcity.dto.NotificationResponse;
import com.rentcity.Rentcity.dto.NotificationUnreadCountResponse;
import com.rentcity.Rentcity.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getMyNotifications(
            Authentication authentication,
            @RequestParam(defaultValue = "false") boolean unreadOnly
    ) {
        return ResponseEntity.ok(notificationService.getMyNotifications(authentication.getName(), unreadOnly));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<NotificationUnreadCountResponse> getUnreadCount(Authentication authentication) {
        return ResponseEntity.ok(NotificationUnreadCountResponse.builder()
                .count(notificationService.countMyUnreadNotifications(authentication.getName()))
                .build());
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markAsRead(
            Authentication authentication,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(notificationService.markAsRead(authentication.getName(), id));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(Authentication authentication) {
        notificationService.markAllAsRead(authentication.getName());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(
            Authentication authentication,
            @PathVariable Long id
    ) {
        notificationService.deleteNotification(authentication.getName(), id);
        return ResponseEntity.noContent().build();
    }
}
