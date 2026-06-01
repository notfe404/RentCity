package com.rentcity.Rentcity.service;

import com.rentcity.Rentcity.dto.BranchRequest;
import com.rentcity.Rentcity.dto.BranchResponse;
import com.rentcity.Rentcity.entity.Branch;
import com.rentcity.Rentcity.exception.ResourceNotFoundException;
import com.rentcity.Rentcity.repository.BranchRepository;
import com.rentcity.Rentcity.repository.CarRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Nghiệp vụ quản lý chi nhánh (B2 — CRUD chi nhánh). */
@Service
@RequiredArgsConstructor
public class BranchService {

    private final BranchRepository branchRepository;
    private final CarRepository carRepository;

    @Transactional(readOnly = true)
    public List<BranchResponse> getAll() {
        return branchRepository.findAll().stream().map(this::mapToResponse).toList();
    }

    @Transactional(readOnly = true)
    public BranchResponse getById(Long id) {
        return mapToResponse(findBranch(id));
    }

    @Transactional
    public BranchResponse create(BranchRequest request) {
        if (branchRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException("Chi nhánh đã tồn tại: " + request.getName());
        }
        Branch branch = Branch.builder()
                .name(request.getName())
                .address(request.getAddress())
                .phone(request.getPhone())
                .city(request.getCity())
                .build();
        return mapToResponse(branchRepository.save(branch));
    }

    @Transactional
    public BranchResponse update(Long id, BranchRequest request) {
        Branch branch = findBranch(id);
        if (branchRepository.existsByNameAndIdNot(request.getName(), id)) {
            throw new IllegalArgumentException("Chi nhánh đã tồn tại: " + request.getName());
        }
        branch.setName(request.getName());
        branch.setAddress(request.getAddress());
        branch.setPhone(request.getPhone());
        branch.setCity(request.getCity());
        return mapToResponse(branchRepository.save(branch));
    }

    @Transactional
    public void delete(Long id) {
        Branch branch = findBranch(id);
        if (carRepository.existsByBranchId(id)) {
            throw new IllegalArgumentException("Không thể xóa chi nhánh đang có xe");
        }
        branchRepository.delete(branch);
    }

    private Branch findBranch(Long id) {
        return branchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("chi nhánh", id));
    }

    private BranchResponse mapToResponse(Branch b) {
        return BranchResponse.builder()
                .id(b.getId())
                .name(b.getName())
                .address(b.getAddress())
                .phone(b.getPhone())
                .city(b.getCity())
                .build();
    }
}
