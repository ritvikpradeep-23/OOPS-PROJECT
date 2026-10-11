package com.college.disasterrelief.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "resources")
@Getter
@Setter
@NoArgsConstructor
public class Resource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private Integer quantity = 0;

    private String location;

    @Column(name = "minimum_required", nullable = false)
    private Integer minimumRequired = 0;

    private Double latitude;

    private Double longitude;

    public boolean isLowStock() {
        return quantity < minimumRequired;
    }
}
