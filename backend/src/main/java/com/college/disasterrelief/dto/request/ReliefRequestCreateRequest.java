package com.college.disasterrelief.dto.request;

import com.college.disasterrelief.model.enums.Priority;
import com.college.disasterrelief.model.enums.RequestType;
import jakarta.validation.constraints.NotNull;

public record ReliefRequestCreateRequest(
        Long disasterId,
        @NotNull RequestType requestType,
        String description,
        @NotNull Priority priority,
        Double latitude,
        Double longitude,
        String locationText,
        Integer peopleAffected
) {
}
