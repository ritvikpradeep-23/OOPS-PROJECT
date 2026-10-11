package com.college.disasterrelief.service;

import com.college.disasterrelief.dto.resource.ResourceRequest;
import com.college.disasterrelief.dto.resource.ResourceResponse;
import com.college.disasterrelief.dto.resource.ResourceTransactionResponse;
import com.college.disasterrelief.dto.resource.RestockRequest;
import com.college.disasterrelief.exception.ResourceNotFoundException;
import com.college.disasterrelief.model.Resource;
import com.college.disasterrelief.model.ResourceTransaction;
import com.college.disasterrelief.model.enums.TransactionType;
import com.college.disasterrelief.repository.ResourceRepository;
import com.college.disasterrelief.repository.ResourceTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ResourceService {

    private final ResourceRepository resourceRepository;
    private final ResourceTransactionRepository resourceTransactionRepository;

    public ResourceResponse create(ResourceRequest request) {
        Resource resource = new Resource();
        applyRequest(resource, request);
        return ResourceResponse.from(resourceRepository.save(resource));
    }

    public ResourceResponse update(Long id, ResourceRequest request) {
        Resource resource = findResource(id);
        applyRequest(resource, request);
        return ResourceResponse.from(resourceRepository.save(resource));
    }

    public void delete(Long id) {
        if (!resourceRepository.existsById(id)) {
            throw ResourceNotFoundException.of("Resource", id);
        }
        resourceRepository.deleteById(id);
    }

    public List<ResourceResponse> getAll() {
        return resourceRepository.findAll().stream().map(ResourceResponse::from).toList();
    }

    public List<ResourceResponse> getLowStock() {
        return resourceRepository.findLowStock().stream().map(ResourceResponse::from).toList();
    }

    public ResourceTransactionResponse restock(Long id, RestockRequest request) {
        Resource resource = findResource(id);
        resource.setQuantity(resource.getQuantity() + request.quantity());
        resourceRepository.save(resource);

        ResourceTransaction transaction = new ResourceTransaction();
        transaction.setResource(resource);
        transaction.setQuantity(request.quantity());
        transaction.setType(TransactionType.RESTOCK);
        return ResourceTransactionResponse.from(resourceTransactionRepository.save(transaction));
    }

    private void applyRequest(Resource resource, ResourceRequest request) {
        resource.setName(request.name());
        resource.setCategory(request.category());
        resource.setQuantity(request.quantity());
        resource.setLocation(request.location());
        resource.setMinimumRequired(request.minimumRequired());
        resource.setLatitude(request.latitude());
        resource.setLongitude(request.longitude());
    }

    private Resource findResource(Long id) {
        return resourceRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Resource", id));
    }
}
