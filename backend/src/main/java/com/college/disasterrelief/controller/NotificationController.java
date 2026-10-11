package com.college.disasterrelief.controller;

import com.college.disasterrelief.dto.notification.BroadcastRequest;
import com.college.disasterrelief.dto.notification.NotificationResponse;
import com.college.disasterrelief.model.User;
import com.college.disasterrelief.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public List<NotificationResponse> getMine(@AuthenticationPrincipal User user) {
        return notificationService.getForUser(user);
    }

    @PutMapping("/{id}/read")
    public void markRead(@AuthenticationPrincipal User user, @PathVariable Long id) {
        notificationService.markAsRead(user, id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal User user, @PathVariable Long id) {
        notificationService.delete(user, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/broadcast")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Integer> broadcast(@Valid @RequestBody BroadcastRequest request) {
        int recipients = notificationService.broadcast(request.title(), request.message(), request.severity());
        return Map.of("recipients", recipients);
    }
}
