package com.college.disasterrelief.controller;

import com.college.disasterrelief.dto.request.*;
import com.college.disasterrelief.model.User;
import com.college.disasterrelief.model.enums.Role;
import com.college.disasterrelief.service.ReliefRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
public class ReliefRequestController {

    private final ReliefRequestService reliefRequestService;

    @PostMapping
    public ResponseEntity<ReliefRequestResponse> create(@AuthenticationPrincipal User user,
                                                          @Valid @RequestBody ReliefRequestCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reliefRequestService.create(user, request));
    }

    @GetMapping
    public List<ReliefRequestResponse> list(@AuthenticationPrincipal User user) {
        return user.getRole() == Role.ADMIN
                ? reliefRequestService.getAll()
                : reliefRequestService.getMine(user);
    }

    @GetMapping("/{id}")
    public ReliefRequestResponse getById(@AuthenticationPrincipal User user, @PathVariable Long id) {
        return reliefRequestService.getById(user, id);
    }

    @PutMapping("/{id}")
    public ReliefRequestResponse update(@AuthenticationPrincipal User user, @PathVariable Long id,
                                        @Valid @RequestBody ReliefRequestUpdateRequest request) {
        return reliefRequestService.update(user, id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal User user, @PathVariable Long id) {
        reliefRequestService.delete(user, id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/complete")
    public ReliefRequestResponse complete(@AuthenticationPrincipal User user, @PathVariable Long id) {
        return reliefRequestService.complete(user, id);
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ReliefRequestResponse updateStatus(@PathVariable Long id, @Valid @RequestBody StatusUpdateRequest request) {
        return reliefRequestService.updateStatus(id, request.status());
    }

    @PutMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public AssignmentResponse assign(@PathVariable Long id, @RequestBody AssignRequest request) {
        return reliefRequestService.assign(id, request);
    }
}
