package com.college.disasterrelief.dto.volunteer;

import com.college.disasterrelief.model.RequestAssignment;
import com.college.disasterrelief.model.VolunteerProfile;
import com.college.disasterrelief.model.enums.AssignmentStatus;
import com.college.disasterrelief.model.enums.Availability;
import com.college.disasterrelief.model.enums.RequestType;
import com.college.disasterrelief.model.enums.VolunteerStatus;

import java.time.LocalDateTime;

public record VolunteerResponse(
        Long id,
        Long userId,
        String userName,
        String userEmail,
        String skills,
        String location,
        Availability availability,
        VolunteerStatus status,
        LocalDateTime createdAt,
        AssignmentInfo assignment
) {
    public record AssignmentInfo(
            Long id,
            Long requestId,
            RequestType requestType,
            String disasterName,
            String location,
            Double latitude,
            Double longitude,
            LocalDateTime scheduledAt,
            AssignmentStatus status
    ) {
        public static AssignmentInfo from(RequestAssignment a) {
            var r = a.getRequest();
            return new AssignmentInfo(a.getId(), r.getId(), r.getRequestType(),
                    r.getDisaster() != null ? r.getDisaster().getName() : null,
                    r.getLocationText(), r.getLatitude(), r.getLongitude(),
                    a.getScheduledAt(), a.getStatus());
        }
    }

    public static VolunteerResponse from(VolunteerProfile v, RequestAssignment latest) {
        return new VolunteerResponse(v.getId(), v.getUser().getId(), v.getUser().getName(), v.getUser().getEmail(),
                v.getSkills(), v.getLocation(), v.getAvailability(),
                v.getStatus() != null ? v.getStatus() : VolunteerStatus.PENDING,
                v.getCreatedAt(), latest != null ? AssignmentInfo.from(latest) : null);
    }
}
