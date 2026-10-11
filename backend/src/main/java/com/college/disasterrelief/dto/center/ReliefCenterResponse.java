package com.college.disasterrelief.dto.center;

import com.college.disasterrelief.model.ReliefCenter;

public record ReliefCenterResponse(
        Long id,
        String name,
        String location,
        Integer capacity,
        Integer occupied,
        String facilities,
        Boolean availability,
        boolean hasSpace,
        Double latitude,
        Double longitude
) {
    public static ReliefCenterResponse from(ReliefCenter c) {
        return new ReliefCenterResponse(c.getId(), c.getName(), c.getLocation(), c.getCapacity(),
                c.getOccupied(), c.getFacilities(), c.getAvailability(), c.hasSpace(),
                c.getLatitude(), c.getLongitude());
    }
}
