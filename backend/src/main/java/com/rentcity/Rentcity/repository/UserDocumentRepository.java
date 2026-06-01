package com.rentcity.Rentcity.repository;

import com.rentcity.Rentcity.entity.UserDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserDocumentRepository extends JpaRepository<UserDocument, Long> {
    List<UserDocument> findByUserIdOrderByCreatedAtDesc(Long userId);
}

