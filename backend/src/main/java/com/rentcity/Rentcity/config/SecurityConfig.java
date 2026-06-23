package com.rentcity.Rentcity.config;

import com.rentcity.Rentcity.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.http.HttpMethod;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        // Auth endpoints
                        .requestMatchers("/auth/register", "/auth/login", "/auth/refresh").permitAll()
                        // Static uploads
                        .requestMatchers("/uploads/**").permitAll()
                        // Payment callbacks
                        .requestMatchers("/payments/vnpay/callback").permitAll()
                        // Public car reads
                        .requestMatchers(HttpMethod.GET, "/cars/search", "/cars/available", "/cars/*", "/cars/*/reviews", "/cars/*/condition").permitAll()
                        .requestMatchers(HttpMethod.GET, "/cars/search", "/cars/available", "/cars/*", "/cars/*/condition").permitAll()
                        // Public branch and category reads
                        .requestMatchers(HttpMethod.GET, "/branches", "/branches/*").permitAll()
                        .requestMatchers(HttpMethod.GET, "/categories", "/categories/*", "/categories/active").permitAll()
                        .requestMatchers(
                                HttpMethod.POST,
                                "/admin/bookings/*/handover",
                                "/admin/bookings/*/return"
                        ).hasAnyRole("ADMIN", "STAFF")
                        // All other requests require authentication (method-level @PreAuthorize handles roles)
                        .anyRequest().authenticated()
                )
                .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
