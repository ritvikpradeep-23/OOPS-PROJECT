package com.college.disasterrelief.model;

import com.college.disasterrelief.model.enums.DisasterStatus;
import com.college.disasterrelief.model.enums.DisasterType;
import com.college.disasterrelief.model.enums.Severity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "disasters")
@Getter
@Setter
@NoArgsConstructor
public class Disaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String location;

    private Integer affected;

    private Integer camps;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DisasterType type;

    @Column(length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Severity severity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DisasterStatus status = DisasterStatus.ACTIVE;

    private Double latitude;

    private Double longitude;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
