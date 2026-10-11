package com.college.disasterrelief.service;

import com.college.disasterrelief.dto.volunteer.VolunteerRegisterRequest;
import com.college.disasterrelief.dto.volunteer.VolunteerResponse;
import com.college.disasterrelief.exception.DuplicateRequestException;
import com.college.disasterrelief.exception.ResourceNotFoundException;
import com.college.disasterrelief.exception.UnauthorizedActionException;
import com.college.disasterrelief.model.RequestAssignment;
import com.college.disasterrelief.model.User;
import com.college.disasterrelief.model.VolunteerProfile;
import com.college.disasterrelief.model.enums.AssignmentStatus;
import com.college.disasterrelief.model.enums.NotificationType;
import com.college.disasterrelief.model.enums.VolunteerStatus;
import com.college.disasterrelief.repository.RequestAssignmentRepository;
import com.college.disasterrelief.repository.VolunteerProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class VolunteerService {

    private final VolunteerProfileRepository volunteerProfileRepository;
    private final RequestAssignmentRepository requestAssignmentRepository;
    private final NotificationService notificationService;

    public VolunteerResponse register(User user, VolunteerRegisterRequest request) {
        if (volunteerProfileRepository.existsByUserId(user.getId())) {
            throw new DuplicateRequestException("You are already registered as a volunteer");
        }

        VolunteerProfile profile = new VolunteerProfile();
        profile.setUser(user);
        profile.setSkills(request.skills());
        profile.setLocation(request.location());
        profile.setStatus(VolunteerStatus.PENDING);
        VolunteerProfile saved = volunteerProfileRepository.save(profile);

        notificationService.notifyAdmins("Volunteer application",
                user.getName() + " applied to volunteer", NotificationType.GENERAL);
        return VolunteerResponse.from(saved, null);
    }

    public List<VolunteerResponse> getAll() {
        return volunteerProfileRepository.findAll().stream().map(this::toResponse).toList();
    }

    public Optional<VolunteerResponse> getMine(User user) {
        return volunteerProfileRepository.findByUserId(user.getId()).map(this::toResponse);
    }

    public VolunteerResponse updateStatus(Long id, VolunteerStatus status) {
        VolunteerProfile profile = volunteerProfileRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Volunteer", id));
        profile.setStatus(status);
        VolunteerProfile saved = volunteerProfileRepository.save(profile);

        notificationService.notify(saved.getUser(), "Application " + status,
                "Your volunteer application is " + status.name().toLowerCase(),
                "Volunteer Application", NotificationType.GENERAL);
        return toResponse(saved);
    }

    public VolunteerResponse respond(User user, Long assignmentId, boolean accepted) {
        RequestAssignment assignment = requestAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> ResourceNotFoundException.of("Assignment", assignmentId));
        VolunteerProfile owner = assignment.getVolunteer();
        if (owner == null || !owner.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedActionException("This assignment belongs to another volunteer");
        }
        assignment.setStatus(accepted ? AssignmentStatus.ACCEPTED : AssignmentStatus.CANCELLED);
        requestAssignmentRepository.save(assignment);

        String verdict = accepted ? "accepted" : "declined";
        notificationService.notifyAdmins("Assignment " + verdict,
                user.getName() + " " + verdict + " assignment RH-" + assignment.getRequest().getId(),
                NotificationType.ASSIGNMENT);
        return toResponse(owner);
    }

    private VolunteerResponse toResponse(VolunteerProfile profile) {
        RequestAssignment latest = requestAssignmentRepository
                .findTopByVolunteerIdOrderByAssignedAtDesc(profile.getId()).orElse(null);
        return VolunteerResponse.from(profile, latest);
    }
}
