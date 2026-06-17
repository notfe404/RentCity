package com.rentcity.Rentcity.service;

import com.rentcity.Rentcity.dto.CreateWithdrawalRequest;
import com.rentcity.Rentcity.dto.WithdrawalRequestResponse;
import com.rentcity.Rentcity.entity.Role;
import com.rentcity.Rentcity.entity.User;
import com.rentcity.Rentcity.entity.WithdrawalRequest;
import com.rentcity.Rentcity.entity.WithdrawalRequestStatus;
import com.rentcity.Rentcity.exception.ResourceNotFoundException;
import com.rentcity.Rentcity.repository.UserRepository;
import com.rentcity.Rentcity.repository.WithdrawalRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WithdrawalRequestService {

    private final WithdrawalRequestRepository requestRepository;
    private final UserRepository userRepository;
    private final WalletService walletService;

    @Transactional
    public WithdrawalRequestResponse create(String email, CreateWithdrawalRequest input) {
        User customer = findUser(email);
        WithdrawalRequest request = requestRepository.save(WithdrawalRequest.builder()
                .userId(customer.getId())
                .amount(input.getAmount())
                .bankName(input.getBankName().trim())
                .accountNumber(input.getAccountNumber().trim())
                .accountHolderName(input.getAccountHolderName().trim())
                .status(WithdrawalRequestStatus.PENDING)
                .build());
        walletService.reserveWithdrawal(
                customer.getId(),
                input.getAmount(),
                "withdrawal:" + request.getId() + ":requested"
        );
        return map(request, customer);
    }

    @Transactional(readOnly = true)
    public List<WithdrawalRequestResponse> getMine(String email) {
        User customer = findUser(email);
        return requestRepository.findByUserIdOrderByCreatedAtDesc(customer.getId()).stream()
                .map(request -> map(request, customer))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<WithdrawalRequestResponse> getAll(WithdrawalRequestStatus status) {
        List<WithdrawalRequest> requests = status == null
                ? requestRepository.findAllByOrderByCreatedAtDesc()
                : requestRepository.findByStatusOrderByCreatedAtDesc(status);
        return requests.stream().map(this::map).toList();
    }

    @Transactional
    public WithdrawalRequestResponse complete(String adminEmail, Long id) {
        User admin = requireAdmin(adminEmail);
        WithdrawalRequest request = getPendingForUpdate(id);
        request.setStatus(WithdrawalRequestStatus.COMPLETED);
        request.setProcessedBy(admin.getId());
        request.setProcessedAt(LocalDateTime.now());
        return map(requestRepository.save(request));
    }

    @Transactional
    public WithdrawalRequestResponse reject(String adminEmail, Long id, String reason) {
        User admin = requireAdmin(adminEmail);
        WithdrawalRequest request = getPendingForUpdate(id);
        request.setStatus(WithdrawalRequestStatus.REJECTED);
        request.setRejectionReason(reason.trim());
        request.setProcessedBy(admin.getId());
        request.setProcessedAt(LocalDateTime.now());
        walletService.reverseWithdrawal(
                request.getUserId(),
                request.getAmount(),
                admin.getId(),
                "withdrawal:" + request.getId() + ":rejected"
        );
        return map(requestRepository.save(request));
    }

    private WithdrawalRequest getPendingForUpdate(Long id) {
        WithdrawalRequest request = requestRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("withdrawal request", id));
        if (request.getStatus() != WithdrawalRequestStatus.PENDING) {
            throw new IllegalArgumentException("Only pending withdrawal requests can be processed");
        }
        return request;
    }

    private User requireAdmin(String email) {
        User user = findUser(email);
        if (user.getRole() != Role.ADMIN) {
            throw new IllegalArgumentException("Only admins can process withdrawal requests");
        }
        return user;
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private WithdrawalRequestResponse map(WithdrawalRequest request) {
        User customer = userRepository.findById(request.getUserId()).orElse(null);
        return map(request, customer);
    }

    private WithdrawalRequestResponse map(WithdrawalRequest request, User customer) {
        return WithdrawalRequestResponse.builder()
                .id(request.getId())
                .userId(request.getUserId())
                .customerName(customer != null ? customer.getFullName() : null)
                .customerEmail(customer != null ? customer.getEmail() : null)
                .amount(request.getAmount())
                .bankName(request.getBankName())
                .accountNumber(request.getAccountNumber())
                .accountHolderName(request.getAccountHolderName())
                .status(request.getStatus())
                .rejectionReason(request.getRejectionReason())
                .processedBy(request.getProcessedBy())
                .processedAt(request.getProcessedAt())
                .createdAt(request.getCreatedAt())
                .build();
    }
}
