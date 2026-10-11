package com.college.disasterrelief.dto.request;

import com.college.disasterrelief.model.ReliefRequest;
import com.college.disasterrelief.model.enums.Priority;
import com.college.disasterrelief.model.enums.RequestStatus;
import com.college.disasterrelief.model.enums.RequestType;

import java.time.LocalDateTime;

public record ReliefRequestResponse(
        Long id,
        Long citizenId,
        String citizenName,
        String citizenEmail,
        Long disasterId,
        RequestType requestType,
        String description,
        Priority priority,
        Double latitude,
        Double longitude,
        String locationText,
        Integer peopleAffected,
        RequestStatus status,
        LocalDateTime createdAt
) {
    public static ReliefRequestResponse from(ReliefRequest r) {
        return new ReliefRequestResponse(
                r.getId(),
                r.getCitizen().getId(),
                r.getCitizen().getName(),
                r.getCitizen().getEmail(),
                r.getDisaster() != null ? r.getDisaster().getId() : null,
                r.getRequestType(),
                r.getDescription(),
                r.getPriority(),
                r.getLatitude(),
                r.getLongitude(),
                r.getLocationText(),
                r.getPeopleAffected(),
                r.getStatus(),
                r.getCreatedAt());
    }
}
