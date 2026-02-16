package com.blog._blog.controller;

import com.blog._blog.dto.AuthenticationRequest;
import com.blog._blog.dto.AuthenticationResponse;
import com.blog._blog.dto.RegisterRequest;
import com.blog._blog.security.JwtService;
import com.blog._blog.service.AuthenticationService;
import lombok.RequiredArgsConstructor;
import javax.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthenticationService service;
    private final JwtService jwtService;

    @Value("${app.auth.cookie-secure:false}")
    private boolean authCookieSecure;

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @Valid @RequestBody RegisterRequest request,
            @RequestHeader(value = "X-Skip-Auth-Cookie", defaultValue = "false") boolean skipAuthCookie) {
        try {
            AuthenticationResponse response = service.register(request);
            ResponseEntity.BodyBuilder builder = ResponseEntity.ok();
            if (!skipAuthCookie) {
                builder.header(HttpHeaders.SET_COOKIE, buildAuthCookie(response.getToken()).toString());
            }
            return builder.body(AuthenticationResponse.builder().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("An error occurred during registration"));
        }
    }

    @PostMapping("/authenticate")
    public ResponseEntity<?> authenticate(
            @Valid @RequestBody AuthenticationRequest request) {
        try {
            AuthenticationResponse response = service.authenticate(request);
            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, buildAuthCookie(response.getToken()).toString())
                    .body(AuthenticationResponse.builder().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("An error occurred during authentication"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        ResponseCookie clearedCookie = ResponseCookie.from("auth_token", "")
                .httpOnly(true)
                .secure(authCookieSecure)
                .path("/")
                .sameSite("Lax")
                .maxAge(Duration.ZERO)
                .build();
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, clearedCookie.toString())
                .build();
    }

    @GetMapping("/csrf")
    public ResponseEntity<Void> csrf(CsrfToken csrfToken) {
        csrfToken.getToken();
        return ResponseEntity.noContent().build();
    }

    private ResponseCookie buildAuthCookie(String token) {
        long expirationMs = jwtService.getExpirationMs() != null ? jwtService.getExpirationMs() : 86400000L;
        return ResponseCookie.from("auth_token", token)
                .httpOnly(true)
                .secure(authCookieSecure)
                .path("/")
                .sameSite("Lax")
                .maxAge(Duration.ofMillis(expirationMs))
                .build();
    }

    // Inner class for error responses
    private static class ErrorResponse {
        private final String message;

        public ErrorResponse(String message) {
            this.message = message;
        }

        public String getMessage() {
            return message;
        }
    }
}
