package com.college.disasterrelief.dto.center;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ReliefCenterRequest(
        @NotBlank String name,
        String location,
        @NotNull @Min(0) Integer capacity,
        @Min(0) Integer occupied,
        String facilities,
        Boolean availability,
        Double latitude,
        Double longitude
) {
}
