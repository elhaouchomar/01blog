package com.blog._blog.service;

import com.blog._blog.dto.AuthenticationRequest;
import com.blog._blog.dto.AuthenticationResponse;
import com.blog._blog.dto.RegisterRequest;
import com.blog._blog.entity.Role;
import com.blog._blog.entity.User;
import com.blog._blog.repository.UserRepository;
import com.blog._blog.security.JwtService;
import com.blog._blog.util.HtmlSanitizer;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AuthenticationService {
        private static final Pattern NAME_PATTERN = Pattern.compile("^[A-Za-z\\-']{2,50}$");
        private static final Pattern EMAIL_PATTERN = Pattern
                        .compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

        private final UserRepository repository;
        private final PasswordEncoder passwordEncoder;
        private final JwtService jwtService;
        private final AuthenticationManager authenticationManager;

        public AuthenticationResponse register(RegisterRequest request) {
                String normalizedEmail = sanitizeAndValidateEmail(request.getEmail());
                String firstName = sanitizeAndValidateName(request.getFirstname(), "First name");
                String lastName = sanitizeAndValidateName(request.getLastname(), "Last name");
                String password = validatePassword(request.getPassword());

                // Check if email already exists
                if (repository.findByEmail(normalizedEmail).isPresent()) {
                        throw new IllegalArgumentException(
                                        "Invalid email use a different email");
                }

                var user = User.builder()
                                .firstname(firstName)
                                .lastname(lastName)
                                .email(normalizedEmail)
                                .password(passwordEncoder.encode(password))
                                // Prevent privilege escalation: self-registration is always USER.
                                .role(Role.USER)
                                .build();
                repository.save(user);
                var jwtToken = jwtService.generateToken(user);
                return AuthenticationResponse.builder()
                                .token(jwtToken)
                                .build();
        }

        public AuthenticationResponse authenticate(AuthenticationRequest request) {
                String normalizedEmail = sanitizeAndValidateEmail(request.getEmail());
                String password = validatePassword(request.getPassword());

                try {
                        authenticationManager.authenticate(
                                        new UsernamePasswordAuthenticationToken(
                                                        normalizedEmail,
                                                        password));
                } catch (Exception e) {
                        throw new IllegalArgumentException("Invalid email or password");
                }

                var user = repository.findByEmail(normalizedEmail)
                                .orElseThrow(() -> new IllegalArgumentException("User not found"));

                // Check for banned status AFTER successful credential verification
                if (Boolean.TRUE.equals(user.getBanned())) {
                        throw new IllegalArgumentException(
                                        "Your account has been restricted. Please contact the administrator.");
                }

                var jwtToken = jwtService.generateToken(user);
                return AuthenticationResponse.builder()
                                .token(jwtToken)
                                .build();
        }

        private String sanitizeAndValidateEmail(String email) {
                String normalizedEmail = HtmlSanitizer.sanitizeAndTrimText(email);
                if (normalizedEmail == null || normalizedEmail.isEmpty()) {
                        throw new IllegalArgumentException("Email is required");
                }
                normalizedEmail = normalizedEmail.toLowerCase();
                if (!EMAIL_PATTERN.matcher(normalizedEmail).matches()) {
                        throw new IllegalArgumentException("Invalid email format");
                }
                return normalizedEmail;
        }

        private String sanitizeAndValidateName(String value, String fieldName) {
                String sanitized = HtmlSanitizer.sanitizeAndTrimText(value);
                if (sanitized == null || sanitized.isEmpty()) {
                        throw new IllegalArgumentException(fieldName + " is required");
                }
                if (!NAME_PATTERN.matcher(sanitized).matches()) {
                        throw new IllegalArgumentException(
                                        fieldName + " must contain only letters and be 2-50 characters");
                }
                return sanitized;
        }

        private String validatePassword(String password) {
                if (password == null || password.trim().isEmpty()) {
                        throw new IllegalArgumentException("Password is required");
                }
                if (password.length() < 6) {
                        throw new IllegalArgumentException("Password must be at least 6 characters");
                }
                return password;
        }
}
