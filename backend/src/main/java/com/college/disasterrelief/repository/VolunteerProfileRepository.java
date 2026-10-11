package com.college.disasterrelief.repository;

import com.college.disasterrelief.model.VolunteerProfile;
import com.college.disasterrelief.model.enums.Availability;
import com.college.disasterrelief.model.enums.VolunteerStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VolunteerProfileRepository extends JpaRepository<VolunteerProfile, Long> {
    Optional<VolunteerProfile> findByUserId(Long userId);
    List<VolunteerProfile> findByAvailability(Availability availability);
    boolean existsByUserId(Long userId);
    long countByStatus(VolunteerStatus status);
}
