package com.college.disasterrelief.dto.request;

import java.time.LocalDateTime;

public record AssignRequest(
        Long rescueTeamId,
        Long volunteerId,
        Long disasterId,
        LocalDateTime scheduledAt
) {
}
