package com.college.disasterrelief.model;

import com.college.disasterrelief.model.enums.AssignmentStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "request_assignments")
@Getter
@Setter
@NoArgsConstructor
public class RequestAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "request_id", nullable = false)
    private ReliefRequest request;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rescue_team_id")
    private RescueTeam rescueTeam;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "volunteer_id")
    private VolunteerProfile volunteer;

    @Column(name = "scheduled_at")
    private LocalDateTime scheduledAt;

    @Column(name = "assigned_at", updatable = false)
    private LocalDateTime assignedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssignmentStatus status = AssignmentStatus.ASSIGNED;

    @PrePersist
    protected void onCreate() {
        this.assignedAt = LocalDateTime.now();
    }
}
