package com.college.disasterrelief.service;

import com.college.disasterrelief.dto.request.AssignRequest;
import com.college.disasterrelief.dto.request.AssignmentResponse;
import com.college.disasterrelief.dto.request.ReliefRequestCreateRequest;
import com.college.disasterrelief.dto.request.ReliefRequestResponse;
import com.college.disasterrelief.dto.request.ReliefRequestUpdateRequest;
import com.college.disasterrelief.exception.DuplicateRequestException;
import com.college.disasterrelief.exception.InvalidStatusTransitionException;
import com.college.disasterrelief.exception.ResourceNotFoundException;
import com.college.disasterrelief.exception.UnauthorizedActionException;
import com.college.disasterrelief.model.*;
import com.college.disasterrelief.model.enums.AssignmentStatus;
import com.college.disasterrelief.model.enums.NotificationType;
import com.college.disasterrelief.model.enums.RequestStatus;
import com.college.disasterrelief.model.enums.Role;
import com.college.disasterrelief.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional
public class ReliefRequestService {

    private static final int DUPLICATE_WINDOW_MINUTES = 30;

    /** Collections demo: explicit state machine of allowed request-status transitions. */
    private static final Map<RequestStatus, Set<RequestStatus>> ALLOWED_TRANSITIONS = Map.of(
            RequestStatus.SUBMITTED, Set.of(RequestStatus.VERIFIED, RequestStatus.REJECTED),
            RequestStatus.VERIFIED, Set.of(RequestStatus.ASSIGNED, RequestStatus.REJECTED),
            RequestStatus.ASSIGNED, Set.of(RequestStatus.IN_PROGRESS),
            RequestStatus.IN_PROGRESS, Set.of(RequestStatus.RESOLVED)
    );

    private static final Set<RequestStatus> COMPLETABLE =
            Set.of(RequestStatus.VERIFIED, RequestStatus.ASSIGNED, RequestStatus.IN_PROGRESS);

    private final ReliefRequestRepository reliefRequestRepository;
    private final DisasterRepository disasterRepository;
    private final RequestAssignmentRepository requestAssignmentRepository;
    private final RescueTeamRepository rescueTeamRepository;
    private final VolunteerProfileRepository volunteerProfileRepository;
    private final ResourceTransactionRepository resourceTransactionRepository;
    private final NotificationService notificationService;

    public ReliefRequestResponse create(User citizen, ReliefRequestCreateRequest request) {
        checkDuplicate(citizen, request);

        ReliefRequest reliefRequest = new ReliefRequest();
        reliefRequest.setCitizen(citizen);
        if (request.disasterId() != null) {
            Disaster disaster = disasterRepository.findById(request.disasterId())
                    .orElseThrow(() -> ResourceNotFoundException.of("Disaster", request.disasterId()));
            reliefRequest.setDisaster(disaster);
        }
        reliefRequest.setRequestType(request.requestType());
        reliefRequest.setDescription(request.description());
        reliefRequest.setPriority(request.priority());
        reliefRequest.setLatitude(request.latitude());
        reliefRequest.setLongitude(request.longitude());
        reliefRequest.setLocationText(request.locationText());
        reliefRequest.setPeopleAffected(request.peopleAffected());

        ReliefRequest saved = reliefRequestRepository.save(reliefRequest);
        notificationService.notifyAdmins("New relief request",
                citizen.getName() + " submitted a " + saved.getRequestType() + " request",
                NotificationType.REQUEST_STATUS_CHANGE);
        return ReliefRequestResponse.from(saved);
    }

    public List<ReliefRequestResponse> getAll() {
        return reliefRequestRepository.findAll().stream().map(ReliefRequestResponse::from).toList();
    }

    public List<ReliefRequestResponse> getMine(User citizen) {
        return reliefRequestRepository.findByCitizen(citizen).stream().map(ReliefRequestResponse::from).toList();
    }

    public ReliefRequestResponse getById(User actor, Long id) {
        ReliefRequest request = findRequest(id);
        requireOwnerOrAdmin(actor, request);
        return ReliefRequestResponse.from(request);
    }

    public ReliefRequestResponse update(User actor, Long id, ReliefRequestUpdateRequest update) {
        ReliefRequest request = findRequest(id);
        requireOwnerOrAdmin(actor, request);
        if (request.getStatus() != RequestStatus.SUBMITTED) {
            throw new InvalidStatusTransitionException("Only pending requests can be edited");
        }
        request.setRequestType(update.requestType());
        request.setDescription(update.description());
        request.setPriority(update.priority());
        request.setLatitude(update.latitude());
        request.setLongitude(update.longitude());
        request.setLocationText(update.locationText());
        request.setPeopleAffected(update.peopleAffected());
        return ReliefRequestResponse.from(reliefRequestRepository.save(request));
    }

    public void delete(User actor, Long id) {
        ReliefRequest request = findRequest(id);
        requireOwnerOrAdmin(actor, request);
        deleteWithDependents(request);
    }

    /** Removes assignments and detaches the allocation log so the request row can be deleted. */
    public void deleteWithDependents(ReliefRequest request) {
        requestAssignmentRepository.deleteAll(requestAssignmentRepository.findByRequestId(request.getId()));
        resourceTransactionRepository.findByRequestId(request.getId()).forEach(t -> {
            t.setRequest(null);
            resourceTransactionRepository.save(t);
        });
        reliefRequestRepository.delete(request);
    }

    public ReliefRequestResponse complete(User actor, Long id) {
        ReliefRequest request = findRequest(id);
        requireOwnerOrAdmin(actor, request);
        if (!COMPLETABLE.contains(request.getStatus())) {
            throw new InvalidStatusTransitionException(
                    "Cannot complete a request that is " + request.getStatus());
        }
        request.setStatus(RequestStatus.RESOLVED);
        ReliefRequest saved = reliefRequestRepository.save(request);
        if (actor.getRole() == Role.ADMIN && !saved.getCitizen().getId().equals(actor.getId())) {
            notificationService.notify(saved.getCitizen(),
                    "Your " + saved.getRequestType() + " request is now " + RequestStatus.RESOLVED,
                    NotificationType.REQUEST_STATUS_CHANGE);
        }
        return ReliefRequestResponse.from(saved);
    }

    public ReliefRequestResponse updateStatus(Long id, RequestStatus newStatus) {
        ReliefRequest request = findRequest(id);
        RequestStatus current = request.getStatus();

        if (current != newStatus) {
            Set<RequestStatus> allowed = ALLOWED_TRANSITIONS.getOrDefault(current, Set.of());
            if (!allowed.contains(newStatus)) {
                throw new InvalidStatusTransitionException(
                        "Cannot move relief request from " + current + " to " + newStatus);
            }
        }

        request.setStatus(newStatus);
        ReliefRequest saved = reliefRequestRepository.save(request);

        notificationService.notify(saved.getCitizen(),
                "Your " + saved.getRequestType() + " request is now " + newStatus,
                NotificationType.REQUEST_STATUS_CHANGE);

        return ReliefRequestResponse.from(saved);
    }

    public AssignmentResponse assign(Long id, AssignRequest assignRequest) {
        ReliefRequest request = findRequest(id);

        if (request.getDisaster() == null && assignRequest.disasterId() != null) {
            request.setDisaster(disasterRepository.findById(assignRequest.disasterId())
                    .orElseThrow(() -> ResourceNotFoundException.of("Disaster", assignRequest.disasterId())));
        }

        RequestAssignment assignment = new RequestAssignment();
        assignment.setRequest(request);
        assignment.setStatus(AssignmentStatus.ASSIGNED);
        assignment.setScheduledAt(assignRequest.scheduledAt());

        VolunteerProfile volunteer = null;
        if (assignRequest.rescueTeamId() != null) {
            RescueTeam team = rescueTeamRepository.findById(assignRequest.rescueTeamId())
                    .orElseThrow(() -> ResourceNotFoundException.of("RescueTeam", assignRequest.rescueTeamId()));
            assignment.setRescueTeam(team);
        }
        if (assignRequest.volunteerId() != null) {
            volunteer = volunteerProfileRepository.findById(assignRequest.volunteerId())
                    .orElseThrow(() -> ResourceNotFoundException.of("Volunteer", assignRequest.volunteerId()));
            assignment.setVolunteer(volunteer);
        }

        RequestAssignment saved = requestAssignmentRepository.save(assignment);

        if (request.getStatus() == RequestStatus.VERIFIED) {
            request.setStatus(RequestStatus.ASSIGNED);
        }
        reliefRequestRepository.save(request);

        notificationService.notify(request.getCitizen(),
                "A responder has been assigned to your " + request.getRequestType() + " request",
                NotificationType.ASSIGNMENT);
        if (volunteer != null) {
            notificationService.notify(volunteer.getUser(), "New volunteer assignment",
                    "You were assigned to relief request RH-" + request.getId(), "Volunteer Assignment",
                    NotificationType.ASSIGNMENT);
        }

        return AssignmentResponse.from(saved);
    }

    private void requireOwnerOrAdmin(User actor, ReliefRequest request) {
        boolean owner = request.getCitizen().getId().equals(actor.getId());
        if (!owner && actor.getRole() != Role.ADMIN) {
            throw new UnauthorizedActionException("You can only access your own relief requests");
        }
    }

    private void checkDuplicate(User citizen, ReliefRequestCreateRequest request) {
        LocalDateTime since = LocalDateTime.now().minusMinutes(DUPLICATE_WINDOW_MINUTES);
        List<ReliefRequest> existing = request.disasterId() != null
                ? reliefRequestRepository.findByCitizenIdAndRequestTypeAndDisasterIdAndCreatedAtAfter(
                        citizen.getId(), request.requestType(), request.disasterId(), since)
                : reliefRequestRepository.findByCitizenIdAndRequestTypeAndDisasterIsNullAndCreatedAtAfter(
                        citizen.getId(), request.requestType(), since);

        if (!existing.isEmpty()) {
            throw new DuplicateRequestException(
                    "A similar " + request.requestType() + " request was already submitted recently");
        }
    }

    private ReliefRequest findRequest(Long id) {
        return reliefRequestRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("ReliefRequest", id));
    }
}
