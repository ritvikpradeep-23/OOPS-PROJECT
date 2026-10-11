package com.college.disasterrelief.service;

import com.college.disasterrelief.dto.user.DashboardSummaryResponse;
import com.college.disasterrelief.dto.user.UpdateProfileRequest;
import com.college.disasterrelief.dto.user.UserResponse;
import com.college.disasterrelief.exception.ResourceNotFoundException;
import com.college.disasterrelief.exception.UnauthorizedActionException;
import com.college.disasterrelief.model.User;
import com.college.disasterrelief.repository.NotificationRepository;
import com.college.disasterrelief.repository.ReliefRequestRepository;
import com.college.disasterrelief.repository.RequestAssignmentRepository;
import com.college.disasterrelief.repository.UserRepository;
import com.college.disasterrelief.repository.VolunteerProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final VolunteerProfileRepository volunteerProfileRepository;
    private final RequestAssignmentRepository requestAssignmentRepository;
    private final ReliefRequestRepository reliefRequestRepository;
    private final ReliefRequestService reliefRequestService;

    public UserResponse getById(Long id) {
        return UserResponse.from(findUser(id));
    }

    public List<UserResponse> getAll() {
        return userRepository.findAll().stream().map(UserResponse::from).toList();
    }

    public UserResponse updateProfile(User currentUser, UpdateProfileRequest request) {
        currentUser.setName(request.name());
        currentUser.setPhone(request.phone());
        currentUser.setLocation(request.location());
        return UserResponse.from(userRepository.save(currentUser));
    }

    /** Removes the account together with everything that references it. */
    @Transactional
    public void deleteUser(User actor, Long id) {
        if (actor.getId().equals(id)) {
            throw new UnauthorizedActionException("You cannot delete your own account");
        }
        User user = findUser(id);

        notificationRepository.deleteByUserId(id);
        volunteerProfileRepository.findByUserId(id).ifPresent(profile -> {
            requestAssignmentRepository.deleteAll(requestAssignmentRepository.findByVolunteerId(profile.getId()));
            volunteerProfileRepository.delete(profile);
        });
        reliefRequestRepository.findByCitizen(user).forEach(reliefRequestService::deleteWithDependents);
        userRepository.delete(user);
    }

    /** Polymorphism demo: getDashboardSummary() resolves differently per concrete User subclass. */
    public DashboardSummaryResponse getDashboard(User currentUser) {
        return new DashboardSummaryResponse(currentUser.getRole(), currentUser.getDashboardSummary());
    }

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("User", id));
    }
}
