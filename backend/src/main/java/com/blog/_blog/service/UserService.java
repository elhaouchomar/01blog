package com.blog._blog.service;

import com.blog._blog.dto.UserDTO;
import com.blog._blog.entity.NotificationType;
import com.blog._blog.entity.User;
import com.blog._blog.repository.UserRepository;
import com.blog._blog.util.HtmlSanitizer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final com.blog._blog.repository.PostRepository postRepository;

    @Transactional(readOnly = true)
    public List<UserDTO> getAllUsers(String currentUserEmail) {
        User currentUser = currentUserEmail != null ? userRepository.findByEmail(currentUserEmail).orElse(null) : null;
        return userRepository.findAll().stream()
                .map(user -> convertToDTO(user, currentUser))
                .collect(Collectors.toList());
    }

    @Transactional
    public UserDTO updateProfile(String email, UserDTO updateRequest) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (updateRequest.getFirstname() != null)
            user.setFirstname(HtmlSanitizer.sanitizeText(updateRequest.getFirstname()));
        if (updateRequest.getLastname() != null)
            user.setLastname(HtmlSanitizer.sanitizeText(updateRequest.getLastname()));
        if (updateRequest.getBio() != null)
            user.setBio(HtmlSanitizer.sanitizeText(updateRequest.getBio()));
        if (updateRequest.getAvatar() != null)
            user.setAvatar(updateRequest.getAvatar());
        if (updateRequest.getCover() != null)
            user.setCover(updateRequest.getCover());
        if (updateRequest.getSubscribed() != null)
            user.setSubscribed(updateRequest.getSubscribed());

        User saved = userRepository.save(user);
        return convertToDTO(saved, saved);
    }

    @Transactional
    public UserDTO toggleSubscribe(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setSubscribed(!user.getSubscribed());
        User saved = userRepository.save(user);
        return convertToDTO(saved, saved);
    }

    @Transactional
    public void followUser(String followerEmail, Integer targetUserId) {
        User follower = userRepository.findByEmail(followerEmail)
                .orElseThrow(() -> new RuntimeException("Follower not found"));
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("Target user not found"));

        if (follower.getId().equals(target.getId())) {
            throw new RuntimeException("You cannot follow yourself");
        }

        if (follower.getFollowing().contains(target)) {
            follower.getFollowing().remove(target);
        } else {
            follower.getFollowing().add(target);
            notificationService.createNotification(target, follower, NotificationType.FOLLOW,
                    Long.valueOf(follower.getId()));
        }

        userRepository.save(follower);
    }

    @Transactional(readOnly = true)
    public UserDTO getUserById(Integer id, String currentUserEmail) {
        User targetUser = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        User currentUser = currentUserEmail != null ? userRepository.findByEmail(currentUserEmail).orElse(null) : null;
        return convertToDTO(targetUser, currentUser);
    }

    @Transactional(readOnly = true)
    public UserDTO getCurrentUser(String email) {
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return convertToDTO(currentUser, currentUser);
    }

    @Transactional
    public void deleteUser(Integer id, String requesterEmail) {
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (requester.getRole() != com.blog._blog.entity.Role.ADMIN) {
            throw new RuntimeException("Unauthorized");
        }

        if (requester.getId().equals(id)) {
            throw new RuntimeException("Cannot delete yourself");
        }

        User userToDelete = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        userRepository.delete(userToDelete);
    }

    @Transactional
    public UserDTO toggleBan(Integer id, String requesterEmail) {
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (requester.getRole() != com.blog._blog.entity.Role.ADMIN) {
            throw new RuntimeException("Unauthorized");
        }

        if (requester.getId().equals(id)) {
            throw new RuntimeException("Cannot ban yourself");
        }

        User userToBan = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        userToBan.setBanned(!Boolean.TRUE.equals(userToBan.getBanned()));
        User saved = userRepository.save(userToBan);
        return convertToDTO(saved, requester);
    }

    @Transactional
    public UserDTO adminUpdateUser(Integer id, UserDTO updateRequest, String requesterEmail) {
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (requester.getRole() != com.blog._blog.entity.Role.ADMIN) {
            throw new RuntimeException("Unauthorized");
        }

        User userToUpdate = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (updateRequest.getFirstname() != null)
            userToUpdate.setFirstname(HtmlSanitizer.sanitizeText(updateRequest.getFirstname()));
        if (updateRequest.getLastname() != null)
            userToUpdate.setLastname(HtmlSanitizer.sanitizeText(updateRequest.getLastname()));
        if (updateRequest.getBio() != null)
            userToUpdate.setBio(HtmlSanitizer.sanitizeText(updateRequest.getBio()));
        if (updateRequest.getAvatar() != null)
            userToUpdate.setAvatar(updateRequest.getAvatar());
        if (updateRequest.getCover() != null)
            userToUpdate.setCover(updateRequest.getCover());
        if (updateRequest.getRole() != null)
            userToUpdate.setRole(com.blog._blog.entity.Role.valueOf(updateRequest.getRole()));

        User saved = userRepository.save(userToUpdate);
        return convertToDTO(saved, requester);
    }

    public UserDTO convertToDTO(User user, User currentUser) {
        return UserDTO.builder()
                .id(user.getId())
                .firstname(user.getFirstname())
                .lastname(user.getLastname())
                .name(user.getFirstname() + " " + user.getLastname())
                .handle("@" + user.getEmail().split("@")[0])
                .email(user.getEmail())
                .role(user.getRole().name())
                .username(user.getEmail().split("@")[0])
                .avatar(user.getAvatar())
                .cover(user.getCover())
                .bio(user.getBio())
                .createdAt(user.getCreatedAt())
                .subscribed(Boolean.TRUE.equals(user.getSubscribed()))
                .isFollowing(currentUser != null && currentUser.getFollowing().contains(user))
                .followersCount(user.getFollowers() != null ? user.getFollowers().size() : 0)
                .followingCount(user.getFollowing() != null ? user.getFollowing().size() : 0)
                .banned(Boolean.TRUE.equals(user.getBanned()))
                .postCount((int) postRepository.countByAuthorId(user.getId()))
                .build();
    }
}
