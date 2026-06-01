package com.rentcity.Rentcity.config;

import com.rentcity.Rentcity.entity.Branch;
import com.rentcity.Rentcity.entity.Car;
import com.rentcity.Rentcity.repository.BranchRepository;
import com.rentcity.Rentcity.repository.CarRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Component
@Order(2)
@RequiredArgsConstructor
public class BranchDataReconciler implements CommandLineRunner {

    private static final String TARGET_BRANCH_NAME = "Chi nhánh Cầu Giấy";
    private static final String TARGET_BRANCH_ADDRESS = "88 Trần Thái Tông, Cầu Giấy";
    private static final String TARGET_BRANCH_PHONE = "0243766222";
    private static final String TARGET_BRANCH_CITY = "Hà Nội";

    private final BranchRepository branchRepository;
    private final CarRepository carRepository;

    @Override
    @Transactional
    public void run(String... args) {
        reconcileSingleCauGiayBranch();
    }

    private void reconcileSingleCauGiayBranch() {
        Branch targetBranch = branchRepository.findByName(TARGET_BRANCH_NAME)
                .map(this::syncTargetBranchFields)
                .orElseGet(this::createTargetBranch);

        List<Car> carsToReassign = carRepository.findAll().stream()
                .filter(car -> car.getBranch() == null || !car.getBranch().getId().equals(targetBranch.getId()))
                .peek(car -> car.setBranch(targetBranch))
                .toList();

        if (!carsToReassign.isEmpty()) {
            carRepository.saveAll(carsToReassign);
        }

        List<Branch> redundantBranches = branchRepository.findAll().stream()
                .filter(branch -> !branch.getId().equals(targetBranch.getId()))
                .toList();

        if (!redundantBranches.isEmpty()) {
            branchRepository.deleteAll(redundantBranches);
        }

        log.info("[BranchDataReconciler] Hệ thống hiện chỉ giữ lại 1 chi nhánh: {}", TARGET_BRANCH_NAME);
    }

    private Branch syncTargetBranchFields(Branch branch) {
        branch.setAddress(TARGET_BRANCH_ADDRESS);
        branch.setPhone(TARGET_BRANCH_PHONE);
        branch.setCity(TARGET_BRANCH_CITY);
        return branchRepository.save(branch);
    }

    private Branch createTargetBranch() {
        return branchRepository.save(Branch.builder()
                .name(TARGET_BRANCH_NAME)
                .address(TARGET_BRANCH_ADDRESS)
                .phone(TARGET_BRANCH_PHONE)
                .city(TARGET_BRANCH_CITY)
                .build());
    }
}
