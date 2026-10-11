package com.college.disasterrelief.service;

import com.college.disasterrelief.dto.center.ReliefCenterRequest;
import com.college.disasterrelief.dto.center.ReliefCenterResponse;
import com.college.disasterrelief.exception.ResourceNotFoundException;
import com.college.disasterrelief.model.ReliefCenter;
import com.college.disasterrelief.repository.ReliefCenterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReliefCenterService {

    private final ReliefCenterRepository reliefCenterRepository;

    public ReliefCenterResponse create(ReliefCenterRequest request) {
        ReliefCenter center = new ReliefCenter();
        applyRequest(center, request);
        return ReliefCenterResponse.from(reliefCenterRepository.save(center));
    }

    public ReliefCenterResponse update(Long id, ReliefCenterRequest request) {
        ReliefCenter center = findCenter(id);
        applyRequest(center, request);
        return ReliefCenterResponse.from(reliefCenterRepository.save(center));
    }

    public void delete(Long id) {
        if (!reliefCenterRepository.existsById(id)) {
            throw ResourceNotFoundException.of("ReliefCenter", id);
        }
        reliefCenterRepository.deleteById(id);
    }

    public List<ReliefCenterResponse> getAll() {
        return reliefCenterRepository.findAll().stream().map(ReliefCenterResponse::from).toList();
    }

    public ReliefCenterResponse getById(Long id) {
        return ReliefCenterResponse.from(findCenter(id));
    }

    private void applyRequest(ReliefCenter center, ReliefCenterRequest request) {
        center.setName(request.name());
        center.setLocation(request.location());
        center.setCapacity(request.capacity());
        center.setOccupied(request.occupied() != null ? request.occupied() : 0);
        center.setFacilities(request.facilities());
        center.setAvailability(request.availability() != null ? request.availability() : true);
        center.setLatitude(request.latitude());
        center.setLongitude(request.longitude());
    }

    private ReliefCenter findCenter(Long id) {
        return reliefCenterRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("ReliefCenter", id));
    }
}
