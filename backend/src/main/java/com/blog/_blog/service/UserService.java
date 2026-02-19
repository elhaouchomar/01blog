package com.blog._blog.service;

import com.blog._blog.dto.UserDTO;
import com.blog._blog.entity.NotificationType;
import com.blog._blog.entity.User;
import com.blog._blog.repository.CommentRepository;
import com.blog._blog.repository.NotificationRepository;
import com.blog._blog.repository.PostRepository;
import com.blog._blog.repository.ReportRepository;
import com.blog._blog.repository.UserRepository;
import com.blog._blog.util.HtmlSanitizer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {
    private static final Pattern NAME_PATTERN = Pattern.compile("^[A-Za-z\\-']{2,50}$");


    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final NotificationRepository notificationRepository;
    private final ReportRepository reportRepository;

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

        if (Boolean.TRUE.equals(user.getBanned())) {
            throw new RuntimeException("You are banned and cannot update your profile");
        }

        if (updateRequest.getFirstname() != null)
            user.setFirstname(sanitizeAndValidateName(updateRequest.getFirstname(), "First name"));
        if (updateRequest.getLastname() != null)
            user.setLastname(sanitizeAndValidateName(updateRequest.getLastname(), "Last name"));
        if (updateRequest.getBio() != null)
            user.setBio(sanitizeBio(updateRequest.getBio()));
        if (updateRequest.getAvatar() != null)
            user.setAvatar(sanitizeOptionalMediaUrl(updateRequest.getAvatar(), "Avatar"));
        if (updateRequest.getCover() != null)
            user.setCover(sanitizeOptionalMediaUrl(updateRequest.getCover(), "Cover"));
        if (updateRequest.getSubscribed() != null)
            user.setSubscribed(updateRequest.getSubscribed());

        User saved = userRepository.save(user);
        return convertToDTO(saved, saved);
    }

    @Transactional
    public UserDTO toggleSubscribe(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (Boolean.TRUE.equals(user.getBanned())) {
            throw new RuntimeException("You are banned and cannot subscribe");
        }

        user.setSubscribed(!user.getSubscribed());
        User saved = userRepository.save(user);
        return convertToDTO(saved, saved);
    }

    @Transactional
    public void followUser(String followerEmail, Integer targetUserId) {
        User follower = userRepository.findByEmail(followerEmail)
                .orElseThrow(() -> new RuntimeException("Follower not found"));

        if (Boolean.TRUE.equals(follower.getBanned())) {
            throw new RuntimeException("You are banned and cannot follow users");
        }

        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("Target user not found"));

        if (follower.getId().equals(target.getId())) {
            throw new RuntimeException("You cannot follow yourself");
        }

        if (follower.getFollowing().contains(target)) {
            follower.getFollowing().remove(target);
            notificationService.deleteNotification(
                    target,
                    follower,
                    NotificationType.FOLLOW,
                    Long.valueOf(follower.getId()));
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

        // 1. Remove user from followers/following sets
        for (User following : new java.util.HashSet<>(userToDelete.getFollowing())) {
            following.getFollowers().remove(userToDelete);
            userToDelete.getFollowing().remove(following);
        }
        for (User follower : new java.util.HashSet<>(userToDelete.getFollowers())) {
            follower.getFollowing().remove(userToDelete);
            userToDelete.getFollowers().remove(follower);
        }

        // 2. Clear likes from posts and comments
        List<com.blog._blog.entity.Post> allPosts = postRepository.findAll();
        for (com.blog._blog.entity.Post post : allPosts) {
            if (post.getLikes().contains(userToDelete)) {
                post.getLikes().remove(userToDelete);
                postRepository.save(post);
            }
        }
        List<com.blog._blog.entity.Comment> allComments = commentRepository.findAll();
        for (com.blog._blog.entity.Comment comment : allComments) {
            if (comment.getLikes().contains(userToDelete)) {
                comment.getLikes().remove(userToDelete);
                commentRepository.save(comment);
            }
        }

        // 3. Delete notifications where user is recipient or actor
        notificationRepository.deleteByRecipient(userToDelete);
        notificationRepository.deleteByActor(userToDelete);

        // 4. Delete reports by or against user, and reports against user's posts
        reportRepository.deleteByReporter(userToDelete);
        reportRepository.deleteByReportedUser(userToDelete);
        reportRepository.deleteByReportedPostAuthor(userToDelete);

        // 5. Posts and Comments are handled by CascadeType.ALL in User entity
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
            userToUpdate.setFirstname(sanitizeAndValidateName(updateRequest.getFirstname(), "First name"));
        if (updateRequest.getLastname() != null)
            userToUpdate.setLastname(sanitizeAndValidateName(updateRequest.getLastname(), "Last name"));
        if (updateRequest.getBio() != null)
            userToUpdate.setBio(sanitizeBio(updateRequest.getBio()));
        if (updateRequest.getAvatar() != null)
            userToUpdate.setAvatar(sanitizeOptionalMediaUrl(updateRequest.getAvatar(), "Avatar"));
        if (updateRequest.getCover() != null)
            userToUpdate.setCover(sanitizeOptionalMediaUrl(updateRequest.getCover(), "Cover"));
        if (updateRequest.getRole() != null)
            userToUpdate.setRole(com.blog._blog.entity.Role.valueOf(updateRequest.getRole()));

        User saved = userRepository.save(userToUpdate);
        return convertToDTO(saved, requester);
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

    private String sanitizeBio(String value) {
        String sanitized = HtmlSanitizer.sanitizeAndTrimText(value);
        if (sanitized == null || sanitized.isEmpty()) {
            return null;
        }
        if (sanitized.length() > 500) {
            throw new IllegalArgumentException("Bio must be less than 500 characters");
        }
        return sanitized;
    }

    private String sanitizeOptionalMediaUrl(String value, String fieldName) {
        String sanitized = HtmlSanitizer.sanitizeAndTrimText(value);
        if (sanitized == null || sanitized.isEmpty()) {
            return null;
        }
        if (sanitized.length() > 2048) {
            throw new IllegalArgumentException(fieldName + " URL must be less than 2048 characters");
        }
        if (!isAllowedMediaUrl(sanitized)) {
            throw new IllegalArgumentException(fieldName + " URL must be an http(s) URL or base64 image/video data URL");
        }
        return sanitized;
    }

    private boolean isAllowedMediaUrl(String value) {
        String lowered = value.toLowerCase(Locale.ROOT);
        if (lowered.startsWith("data:image/") || lowered.startsWith("data:video/")) {
            return true;
        }
        try {
            URI uri = new URI(value);
            String scheme = uri.getScheme();
            return "http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme);
        } catch (URISyntaxException ignored) {
            return false;
        }
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
