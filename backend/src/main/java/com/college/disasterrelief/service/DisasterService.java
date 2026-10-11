package com.college.disasterrelief.service;

import com.college.disasterrelief.dto.disaster.DisasterRequest;
import com.college.disasterrelief.dto.disaster.DisasterResponse;
import com.college.disasterrelief.exception.ResourceNotFoundException;
import com.college.disasterrelief.model.Disaster;
import com.college.disasterrelief.model.enums.DisasterStatus;
import com.college.disasterrelief.repository.DisasterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DisasterService {

    private final DisasterRepository disasterRepository;

    public DisasterResponse create(DisasterRequest request) {
        Disaster disaster = new Disaster();
        applyRequest(disaster, request);
        return DisasterResponse.from(disasterRepository.save(disaster));
    }

    public DisasterResponse update(Long id, DisasterRequest request) {
        Disaster disaster = findDisaster(id);
        applyRequest(disaster, request);
        return DisasterResponse.from(disasterRepository.save(disaster));
    }

    public void delete(Long id) {
        if (!disasterRepository.existsById(id)) {
            throw ResourceNotFoundException.of("Disaster", id);
        }
        disasterRepository.deleteById(id);
    }

    public DisasterResponse getById(Long id) {
        return DisasterResponse.from(findDisaster(id));
    }

    public List<DisasterResponse> getAll() {
        return disasterRepository.findAll().stream().map(DisasterResponse::from).toList();
    }

    public List<DisasterResponse> getActive() {
        return disasterRepository.findByStatus(DisasterStatus.ACTIVE).stream()
                .map(DisasterResponse::from).toList();
    }

    private void applyRequest(Disaster disaster, DisasterRequest request) {
        disaster.setName(request.name());
        disaster.setLocation(request.location());
        disaster.setAffected(request.affected());
        disaster.setCamps(request.camps());
        disaster.setType(request.type());
        disaster.setDescription(request.description());
        disaster.setSeverity(request.severity());
        disaster.setStatus(request.status() != null ? request.status() : DisasterStatus.ACTIVE);
        disaster.setLatitude(request.latitude());
        disaster.setLongitude(request.longitude());
    }

    private Disaster findDisaster(Long id) {
        return disasterRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Disaster", id));
    }
}
