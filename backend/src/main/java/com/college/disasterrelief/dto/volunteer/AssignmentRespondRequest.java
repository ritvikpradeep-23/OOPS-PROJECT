package com.college.disasterrelief.dto.volunteer;

import jakarta.validation.constraints.NotNull;

public record AssignmentRespondRequest(@NotNull Boolean accepted) {
}
