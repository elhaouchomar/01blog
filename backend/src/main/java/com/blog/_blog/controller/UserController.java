package com.blog._blog.controller;

import com.blog._blog.dto.UserDTO;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;

import javax.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final com.blog._blog.service.UserService userService;

    @GetMapping
    public ResponseEntity<java.util.List<UserDTO>> getAllUsers(Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(userService.getAllUsers(email));
    }

    @GetMapping("/me")
    public ResponseEntity<UserDTO> getAuthenticatedUser(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(userService.getCurrentUser(email));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Integer id, Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(userService.getUserById(id, email));
    }

    @PutMapping("/me")
    public ResponseEntity<UserDTO> updateAuthenticatedUser(@Valid @RequestBody UserDTO userDTO,
            Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(userService.updateProfile(email, userDTO));
    }

    @PutMapping("/me/subscribe")
    public ResponseEntity<UserDTO> toggleSubscribe(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(userService.toggleSubscribe(email));
    }

    @PostMapping("/{id}/follow")
    public ResponseEntity<Void> followUser(@PathVariable Integer id, Authentication authentication) {
        String email = authentication.getName();
        userService.followUser(email, id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Integer id, Authentication authentication) {
        String email = authentication.getName();
        userService.deleteUser(id, email);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/ban")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<UserDTO> toggleBan(@PathVariable Integer id, Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(userService.toggleBan(id, email));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<UserDTO> adminUpdateUser(@PathVariable Integer id, @Valid @RequestBody UserDTO userDTO,
            Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(userService.adminUpdateUser(id, userDTO, email));
    }
}
