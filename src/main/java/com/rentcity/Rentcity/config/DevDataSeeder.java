package com.rentcity.Rentcity.config;

import com.rentcity.Rentcity.entity.KycStatus;
import com.rentcity.Rentcity.entity.Role;
import com.rentcity.Rentcity.entity.User;
import com.rentcity.Rentcity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@Profile("dev")
@RequiredArgsConstructor
public class DevDataSeeder {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    CommandLineRunner seedDemoUsers() {
        return args -> {
            createUserIfMissing("customer@demo.com", "Customer Demo", "0901234567", Role.CUSTOMER);
            createUserIfMissing("staff@demo.com", "Staff Demo", "0901234568", Role.STAFF);
            createUserIfMissing("admin@demo.com", "Admin Demo", "0901234569", Role.ADMIN);
        };
    }

    private void createUserIfMissing(String email, String fullName, String phone, Role role) {
        if (userRepository.existsByEmail(email)) {
            return;
        }

        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode("Password123"))
                .fullName(fullName)
                .phone(phone)
                .role(role)
                .kycStatus(KycStatus.PENDING)
                .build();
        userRepository.save(user);
    }
}

