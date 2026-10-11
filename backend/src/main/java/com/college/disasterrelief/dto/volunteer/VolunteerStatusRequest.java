package com.college.disasterrelief.dto.volunteer;

import com.college.disasterrelief.model.enums.VolunteerStatus;
import jakarta.validation.constraints.NotNull;

public record VolunteerStatusRequest(@NotNull VolunteerStatus status) {
}
