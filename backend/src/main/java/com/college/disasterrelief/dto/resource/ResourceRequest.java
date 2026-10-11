package com.college.disasterrelief.dto.resource;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ResourceRequest(
        @NotBlank String name,
        @NotBlank String category,
        @NotNull @Min(0) Integer quantity,
        String location,
        @NotNull @Min(0) Integer minimumRequired,
        Double latitude,
        Double longitude
) {
}
