package com.college.disasterrelief.controller;

import com.college.disasterrelief.dto.volunteer.AssignmentRespondRequest;
import com.college.disasterrelief.dto.volunteer.VolunteerRegisterRequest;
import com.college.disasterrelief.dto.volunteer.VolunteerResponse;
import com.college.disasterrelief.dto.volunteer.VolunteerStatusRequest;
import com.college.disasterrelief.model.User;
import com.college.disasterrelief.service.VolunteerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/volunteers")
@RequiredArgsConstructor
public class VolunteerController {

    private final VolunteerService volunteerService;

    @PostMapping("/register")
    public ResponseEntity<VolunteerResponse> register(@AuthenticationPrincipal User user,
                                                        @RequestBody VolunteerRegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(volunteerService.register(user, request));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<VolunteerResponse> getAll() {
        return volunteerService.getAll();
    }

    @GetMapping("/me")
    public ResponseEntity<VolunteerResponse> mine(@AuthenticationPrincipal User user) {
        return volunteerService.getMine(user)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public VolunteerResponse updateStatus(@PathVariable Long id, @Valid @RequestBody VolunteerStatusRequest request) {
        return volunteerService.updateStatus(id, request.status());
    }

    @PutMapping("/assignments/{assignmentId}/respond")
    public VolunteerResponse respond(@AuthenticationPrincipal User user, @PathVariable Long assignmentId,
                                     @Valid @RequestBody AssignmentRespondRequest request) {
        return volunteerService.respond(user, assignmentId, request.accepted());
    }
}
