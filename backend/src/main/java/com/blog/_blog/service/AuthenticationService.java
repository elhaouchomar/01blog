package com.blog._blog.service;

import com.blog._blog.dto.AuthenticationRequest;
import com.blog._blog.dto.AuthenticationResponse;
import com.blog._blog.dto.RegisterRequest;
import com.blog._blog.entity.Role;
import com.blog._blog.entity.User;
import com.blog._blog.repository.UserRepository;
import com.blog._blog.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthenticationService {
        private final UserRepository repository;
        private final PasswordEncoder passwordEncoder;
        private final JwtService jwtService;
        private final AuthenticationManager authenticationManager;

        public AuthenticationResponse register(RegisterRequest request) {
                // Validate inputs
                if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
                        throw new IllegalArgumentException("Email is required");
                }
                if (request.getPassword() == null || request.getPassword().isEmpty()) {
                        throw new IllegalArgumentException("Password is required");
                }
                if (request.getFirstname() == null || request.getFirstname().trim().isEmpty()) {
                        throw new IllegalArgumentException("First name is required");
                }
                if (request.getLastname() == null || request.getLastname().trim().isEmpty()) {
                        throw new IllegalArgumentException("Last name is required");
                }

                // Normalize email to lowercase
                String normalizedEmail = request.getEmail().toLowerCase().trim();

                // Check if email already exists
                if (repository.findByEmail(normalizedEmail).isPresent()) {
                        throw new IllegalArgumentException(
                                        "Email already registered. Please use a different email or login.");
                }

                var user = User.builder()
                                .firstname(request.getFirstname().trim())
                                .lastname(request.getLastname().trim())
                                .email(normalizedEmail)
                                .password(passwordEncoder.encode(request.getPassword()))
                                .role(request.getRole() != null ? Role.valueOf(request.getRole()) : Role.USER)
                                .build();
                repository.save(user);
                var jwtToken = jwtService.generateToken(user);
                return AuthenticationResponse.builder()
                                .token(jwtToken)
                                .build();
        }

        public AuthenticationResponse authenticate(AuthenticationRequest request) {
                // Validate inputs
                if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
                        throw new IllegalArgumentException("Email is required");
                }
                if (request.getPassword() == null || request.getPassword().isEmpty()) {
                        throw new IllegalArgumentException("Password is required");
                }

                // Normalize email to lowercase
                String normalizedEmail = request.getEmail().toLowerCase().trim();

                try {
                        authenticationManager.authenticate(
                                        new UsernamePasswordAuthenticationToken(
                                                        normalizedEmail,
                                                        request.getPassword()));
                } catch (Exception e) {
                        throw new IllegalArgumentException("Invalid email or password");
                }

                var user = repository.findByEmail(normalizedEmail)
                                .orElseThrow(() -> new IllegalArgumentException("User not found"));
                var jwtToken = jwtService.generateToken(user);
                return AuthenticationResponse.builder()
                                .token(jwtToken)
                                .build();
        }
}