package com.rentcity.Rentcity.service;

import com.rentcity.Rentcity.dto.PasswordUpdateRequest;
import com.rentcity.Rentcity.dto.ProfileUpdateRequest;
import com.rentcity.Rentcity.dto.UserDocumentResponse;
import com.rentcity.Rentcity.dto.UserResponse;
import com.rentcity.Rentcity.entity.User;
import com.rentcity.Rentcity.entity.UserDocument;
import com.rentcity.Rentcity.repository.UserDocumentRepository;
import com.rentcity.Rentcity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserDocumentRepository userDocumentRepository;
    private final PasswordEncoder passwordEncoder;

    public UserResponse getCurrentProfile(String email) {
        return mapToUserResponse(getUserByEmail(email));
    }

    public UserResponse updateProfile(String email, ProfileUpdateRequest request) {
        User user = getUserByEmail(email);

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getIdCardUrl() != null) {
            user.setIdCardUrl(request.getIdCardUrl());
        }

        userRepository.save(user);
        return mapToUserResponse(user);
    }

    public void updatePassword(String email, PasswordUpdateRequest request) {
        User user = getUserByEmail(email);

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Wrong old password");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    public List<UserDocumentResponse> getDocuments(String email) {
        User user = getUserByEmail(email);
        return userDocumentRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::mapToDocumentResponse)
                .toList();
    }

    public UserDocumentResponse uploadDocument(
            String email,
            String docType,
            String docNumber,
            MultipartFile frontFile,
            MultipartFile backFile
    ) {
        User user = getUserByEmail(email);

        String frontUrl = storeLocalFile(user.getId(), "front", frontFile);
        String backUrl = storeLocalFile(user.getId(), "back", backFile);

        UserDocument document = UserDocument.builder()
                .userId(user.getId())
                .docType(docType)
                .docNumber(docNumber)
                .frontUrl(frontUrl)
                .backUrl(backUrl)
                .verified(false)
                .build();

        return mapToDocumentResponse(userDocumentRepository.save(document));
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .idCardUrl(user.getIdCardUrl())
                .role(user.getRole())
                .kycStatus(user.getKycStatus())
                .build();
    }

    private UserDocumentResponse mapToDocumentResponse(UserDocument document) {
        return UserDocumentResponse.builder()
                .id(document.getId())
                .userId(document.getUserId())
                .docType(document.getDocType())
                .docNumber(document.getDocNumber())
                .frontUrl(document.getFrontUrl())
                .backUrl(document.getBackUrl())
                .verified(document.isVerified())
                .createdAt(document.getCreatedAt())
                .build();
    }

    private String storeLocalFile(Long userId, String side, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Document file is required");
        }

        String originalName = StringUtils.cleanPath(file.getOriginalFilename() == null ? "" : file.getOriginalFilename());
        String extension = getAllowedExtension(originalName, file.getContentType());
        String fileName = "user-" + userId + "-" + side + "-" + UUID.randomUUID() + extension;
        Path uploadRoot = Paths.get("uploads").toAbsolutePath().normalize();
        Path target = uploadRoot.resolve(fileName).normalize();

        if (!target.startsWith(uploadRoot)) {
            throw new IllegalArgumentException("Invalid file path");
        }

        try {
            Files.createDirectories(uploadRoot);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new UncheckedIOException("Could not store document file", ex);
        }

        return ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/uploads/")
                .path(fileName)
                .toUriString();
    }

    private String getAllowedExtension(String fileName, String contentType) {
        String lowerName = fileName.toLowerCase(Locale.ROOT);
        if (lowerName.endsWith(".pdf") || "application/pdf".equals(contentType)) {
            return ".pdf";
        }
        if (lowerName.endsWith(".png") || "image/png".equals(contentType)) {
            return ".png";
        }
        if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg") || "image/jpeg".equals(contentType)) {
            return ".jpg";
        }
        throw new IllegalArgumentException("Only JPEG, PNG, or PDF documents are allowed");
    }
}
