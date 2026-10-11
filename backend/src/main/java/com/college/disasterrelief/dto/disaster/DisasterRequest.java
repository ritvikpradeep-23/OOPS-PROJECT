package com.college.disasterrelief.dto.disaster;

import com.college.disasterrelief.model.enums.DisasterStatus;
import com.college.disasterrelief.model.enums.DisasterType;
import com.college.disasterrelief.model.enums.Severity;
import jakarta.validation.constraints.NotNull;

public record DisasterRequest(
        String name,
        String location,
        Integer affected,
        Integer camps,
        @NotNull DisasterType type,
        String description,
        @NotNull Severity severity,
        DisasterStatus status,
        Double latitude,
        Double longitude
) {
}
