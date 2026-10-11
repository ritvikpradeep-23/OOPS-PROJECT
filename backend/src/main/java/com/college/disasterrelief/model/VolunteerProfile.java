package com.college.disasterrelief.model;

import com.college.disasterrelief.model.enums.Availability;
import com.college.disasterrelief.model.enums.VolunteerStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "volunteers")
@Getter
@Setter
@NoArgsConstructor
public class VolunteerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    private String skills;

    private String location;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Availability availability = Availability.AVAILABLE;

    @Enumerated(EnumType.STRING)
    private VolunteerStatus status = VolunteerStatus.PENDING;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
