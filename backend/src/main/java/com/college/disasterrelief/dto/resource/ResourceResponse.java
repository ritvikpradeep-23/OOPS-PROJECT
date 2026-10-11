package com.college.disasterrelief.dto.resource;

import com.college.disasterrelief.model.Resource;

public record ResourceResponse(
        Long id,
        String name,
        String category,
        Integer quantity,
        String location,
        Integer minimumRequired,
        boolean lowStock,
        Double latitude,
        Double longitude
) {
    public static ResourceResponse from(Resource r) {
        return new ResourceResponse(r.getId(), r.getName(), r.getCategory(), r.getQuantity(),
                r.getLocation(), r.getMinimumRequired(), r.isLowStock(), r.getLatitude(), r.getLongitude());
    }
}
