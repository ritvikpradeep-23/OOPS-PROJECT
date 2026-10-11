package com.college.disasterrelief.dto.request;

import com.college.disasterrelief.model.RequestAssignment;
import com.college.disasterrelief.model.enums.AssignmentStatus;

import java.time.LocalDateTime;

public record AssignmentResponse(
        Long id,
        Long requestId,
        Long rescueTeamId,
        Long volunteerId,
        AssignmentStatus status,
        LocalDateTime scheduledAt,
        LocalDateTime assignedAt
) {
    public static AssignmentResponse from(RequestAssignment a) {
        return new AssignmentResponse(
                a.getId(),
                a.getRequest().getId(),
                a.getRescueTeam() != null ? a.getRescueTeam().getId() : null,
                a.getVolunteer() != null ? a.getVolunteer().getId() : null,
                a.getStatus(),
                a.getScheduledAt(),
                a.getAssignedAt());
    }
}
