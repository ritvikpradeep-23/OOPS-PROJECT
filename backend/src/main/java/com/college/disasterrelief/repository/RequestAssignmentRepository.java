package com.college.disasterrelief.repository;

import com.college.disasterrelief.model.RequestAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RequestAssignmentRepository extends JpaRepository<RequestAssignment, Long> {
    List<RequestAssignment> findByRequestId(Long requestId);
    List<RequestAssignment> findByVolunteerId(Long volunteerId);
    Optional<RequestAssignment> findTopByVolunteerIdOrderByAssignedAtDesc(Long volunteerId);
}
