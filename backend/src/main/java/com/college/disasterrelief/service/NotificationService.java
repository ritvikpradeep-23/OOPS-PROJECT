package com.college.disasterrelief.service;

import com.college.disasterrelief.dto.notification.NotificationResponse;
import com.college.disasterrelief.exception.ResourceNotFoundException;
import com.college.disasterrelief.model.Notification;
import com.college.disasterrelief.model.User;
import com.college.disasterrelief.model.enums.NotificationType;
import com.college.disasterrelief.model.enums.Role;
import com.college.disasterrelief.repository.NotificationRepository;
import com.college.disasterrelief.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public void notify(User user, String message, NotificationType type) {
        notify(user, defaultTitle(type), message, "Update", type);
    }

    public void notify(User user, String title, String message, String severity, NotificationType type) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle(title);
        notification.setSeverity(severity);
        notification.setMessage(message);
        notification.setType(type);
        notificationRepository.save(notification);
    }

    public void notifyAdmins(String title, String message, NotificationType type) {
        userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.ADMIN)
                .forEach(admin -> notify(admin, title, message, "Update", type));
    }

    public int broadcast(String title, String message, String severity) {
        List<User> everyone = userRepository.findAll();
        everyone.forEach(u -> notify(u, title, message,
                severity == null || severity.isBlank() ? "General Update" : severity, NotificationType.EMERGENCY_ALERT));
        return everyone.size();
    }

    public List<NotificationResponse> getForUser(User user) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(NotificationResponse::from).toList();
    }

    public void markAsRead(User user, Long notificationId) {
        Notification notification = findOwned(user, notificationId);
        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    public void delete(User user, Long notificationId) {
        notificationRepository.delete(findOwned(user, notificationId));
    }

    private Notification findOwned(User user, Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> ResourceNotFoundException.of("Notification", notificationId));
        if (!notification.getUser().getId().equals(user.getId())) {
            throw ResourceNotFoundException.of("Notification", notificationId);
        }
        return notification;
    }

    private String defaultTitle(NotificationType type) {
        return switch (type) {
            case REQUEST_STATUS_CHANGE -> "Request update";
            case ASSIGNMENT -> "Assignment update";
            case EMERGENCY_ALERT -> "Emergency alert";
            case GENERAL -> "Notice";
        };
    }
}
