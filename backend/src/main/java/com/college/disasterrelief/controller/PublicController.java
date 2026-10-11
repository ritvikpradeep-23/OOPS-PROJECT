package com.college.disasterrelief.controller;

import com.college.disasterrelief.model.enums.DisasterStatus;
import com.college.disasterrelief.model.enums.RequestStatus;
import com.college.disasterrelief.model.enums.VolunteerStatus;
import com.college.disasterrelief.repository.DisasterRepository;
import com.college.disasterrelief.repository.ReliefCenterRepository;
import com.college.disasterrelief.repository.ReliefRequestRepository;
import com.college.disasterrelief.repository.VolunteerProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** Unauthenticated headline numbers for the login screen. */
@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicController {

    private final ReliefCenterRepository reliefCenterRepository;
    private final ReliefRequestRepository reliefRequestRepository;
    private final DisasterRepository disasterRepository;
    private final VolunteerProfileRepository volunteerProfileRepository;

    @GetMapping("/stats")
    public Map<String, Long> stats() {
        return Map.of(
                "centers", reliefCenterRepository.count(),
                "assisted", reliefRequestRepository.countByStatus(RequestStatus.RESOLVED),
                "resolvedDisasters", (long) disasterRepository.findByStatus(DisasterStatus.RESOLVED).size(),
                "activeVolunteers", volunteerProfileRepository.countByStatus(VolunteerStatus.ACTIVE)
        );
    }
}
