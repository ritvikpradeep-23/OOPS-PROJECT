package com.college.disasterrelief.dto.notification;

import jakarta.validation.constraints.NotBlank;

public record BroadcastRequest(
        @NotBlank String title,
        @NotBlank String message,
        String severity
) {
}
