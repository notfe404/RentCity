package com.rentcity.Rentcity.repository;

import com.rentcity.Rentcity.entity.KycStatus;
import com.rentcity.Rentcity.entity.Role;
import com.rentcity.Rentcity.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
    long countByKycStatus(KycStatus kycStatus);
    List<User> findByRoleIn(Collection<Role> roles);
}
