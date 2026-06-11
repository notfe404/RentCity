package com.rentcity.Rentcity.repository;

import com.rentcity.Rentcity.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByRecipientUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long recipientUserId);

    List<Notification> findByRecipientUserIdAndReadAtIsNullAndDeletedAtIsNullOrderByCreatedAtDesc(Long recipientUserId);

    long countByRecipientUserIdAndReadAtIsNullAndDeletedAtIsNull(Long recipientUserId);

    Optional<Notification> findByIdAndRecipientUserIdAndDeletedAtIsNull(Long id, Long recipientUserId);
}
