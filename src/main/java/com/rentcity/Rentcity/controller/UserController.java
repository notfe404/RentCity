package com.rentcity.Rentcity.controller;

import com.rentcity.Rentcity.dto.PasswordUpdateRequest;
import com.rentcity.Rentcity.dto.ProfileUpdateRequest;
import com.rentcity.Rentcity.dto.UserDocumentResponse;
import com.rentcity.Rentcity.dto.UserResponse;
import com.rentcity.Rentcity.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentProfile(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(userService.getCurrentProfile(email));
    }

    @PutMapping("/update")
    public ResponseEntity<UserResponse> updateProfile(
            Authentication authentication,
            @Valid @RequestBody ProfileUpdateRequest request
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(userService.updateProfile(email, request));
    }

    @GetMapping("/documents")
    public ResponseEntity<List<UserDocumentResponse>> getMyDocuments(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(userService.getDocuments(email));
    }

    @PostMapping("/upload-document")
    public ResponseEntity<UserDocumentResponse> uploadDocument(
            Authentication authentication,
            @RequestParam("docType") String docType,
            @RequestParam(value = "docNumber", required = false) String docNumber,
            @RequestParam("frontFile") MultipartFile frontFile,
            @RequestParam("backFile") MultipartFile backFile
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(userService.uploadDocument(email, docType, docNumber, frontFile, backFile));
    }

    @PutMapping("/me/password")
    public ResponseEntity<Void> updatePassword(
            Authentication authentication,
            @Valid @RequestBody PasswordUpdateRequest request
    ) {
        String email = authentication.getName();
        userService.updatePassword(email, request);
        return ResponseEntity.ok().build();
    }
}

