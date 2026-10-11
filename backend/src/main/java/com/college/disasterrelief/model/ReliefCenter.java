package com.college.disasterrelief.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "relief_centers")
@Getter
@Setter
@NoArgsConstructor
public class ReliefCenter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String location;

    @Column(nullable = false)
    private Integer capacity = 0;

    @Column(nullable = false)
    private Integer occupied = 0;

    private String facilities;

    @Column(nullable = false)
    private Boolean availability = true;

    private Double latitude;

    private Double longitude;

    public boolean hasSpace() {
        return occupied < capacity;
    }
}
