package com.blog._blog.service;

import com.blog._blog.util.HtmlSanitizer;
import com.blog._blog.dto.*;
import com.blog._blog.entity.Comment;
import com.blog._blog.entity.Post;
import com.blog._blog.entity.User;
import com.blog._blog.repository.CommentRepository;
import com.blog._blog.repository.PostRepository;
import com.blog._blog.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.net.URI;
import java.net.URISyntaxException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

import com.blog._blog.entity.NotificationType;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final com.blog._blog.repository.ReportRepository reportRepository;

    @Transactional(readOnly = true)
    public List<PostDTO> getAllPosts(String currentUserEmail) {
        return getAllPosts(currentUserEmail, 0, 100); // Default to first 100 if called without params
    }

    @Transactional(readOnly = true)
    public List<PostDTO> getAllPosts(String currentUserEmail, int page, int size) {
        User currentUser = currentUserEmail != null ? userRepository.findByEmail(currentUserEmail).orElse(null) : null;
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);

        org.springframework.data.domain.Page<Post> postsPage;
        if (currentUser != null && currentUser.getRole() == com.blog._blog.entity.Role.ADMIN) {
            postsPage = postRepository.findAllByOrderByCreatedAtDesc(pageable);
        } else {
            postsPage = postRepository.findByHiddenFalseOrderByCreatedAtDesc(pageable);
        }

        return postsPage.getContent().stream()
                .map(post -> convertToDTO(post, currentUser))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PostDTO> getUserPosts(Integer userId, String currentUserEmail) {
        return getUserPosts(userId, currentUserEmail, 0, 100);
    }

    @Transactional(readOnly = true)
    public List<PostDTO> getUserPosts(Integer userId, String currentUserEmail, int page, int size) {
        User currentUser = currentUserEmail != null ? userRepository.findByEmail(currentUserEmail).orElse(null) : null;
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);

        boolean isOwner = currentUser != null && currentUser.getId().equals(userId);
        boolean isAdmin = currentUser != null && currentUser.getRole() == com.blog._blog.entity.Role.ADMIN;

        org.springframework.data.domain.Page<Post> postsPage;
        if (isOwner || isAdmin) {
            postsPage = postRepository.findByAuthorIdOrderByCreatedAtDesc(userId, pageable);
        } else {
            postsPage = postRepository.findByAuthorIdAndHiddenFalseOrderByCreatedAtDesc(userId, pageable);
        }

        return postsPage.getContent().stream()
                .map(post -> convertToDTO(post, currentUser))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PostDTO getPost(Long id, String currentUserEmail) {
        User currentUser = currentUserEmail != null ? userRepository.findByEmail(currentUserEmail).orElse(null) : null;

        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        boolean isOwner = currentUser != null && post.getAuthor().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser != null && currentUser.getRole() == com.blog._blog.entity.Role.ADMIN;
        if (post.isHidden() && !isOwner && !isAdmin) {
            throw new RuntimeException("Post not found");
        }

        return convertToDTO(post, currentUser);
    }

    @Transactional
    public PostDTO createPost(CreatePostRequest request, String email) {
        User author = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (Boolean.TRUE.equals(author.getBanned())) {
            throw new RuntimeException("You are banned and cannot create posts");
        }

        String sanitizedTitle = sanitizeRequiredText(request.getTitle(), "Title", 3, 150);
        String sanitizedContent = sanitizeRequiredContent(request.getContent(), 3);
        String sanitizedCategory = sanitizeOptionalText(request.getCategory(), 100);
        String sanitizedReadTime = sanitizeOptionalText(request.getReadTime(), 50);
        List<String> sanitizedImages = sanitizeMediaUrlList(request.getImages(), 2048);
        List<String> sanitizedTags = sanitizeStringList(request.getTags(), 60);

        Post post = Post.builder()
                .title(sanitizedTitle)
                .content(sanitizedContent)
                .category(sanitizedCategory)
                .readTime(sanitizedReadTime)
                .images(sanitizedImages)
                .tags(sanitizedTags)
                .author(author)
                .build();

        Post saved = postRepository.save(post);

        // Notify followers
        if (author.getFollowers() != null) {
            author.getFollowers().stream()
                    .filter(follower -> Boolean.TRUE.equals(follower.getSubscribed()))
                    .forEach(follower -> notificationService.createNotification(
                            follower,
                            author,
                            NotificationType.NEW_POST,
                            saved.getId()));
        }

        return convertToDTO(saved, author);
    }

    @Transactional
    public PostDTO updatePost(Long id, CreatePostRequest request, String email) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (Boolean.TRUE.equals(user.getBanned())) {
            throw new RuntimeException("You are banned and cannot edit posts");
        }

        // Only post owner can edit
        if (!post.getAuthor().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        String sanitizedTitle = sanitizeRequiredText(request.getTitle(), "Title", 3, 150);
        String sanitizedContent = sanitizeRequiredContent(request.getContent(), 3);
        String sanitizedCategory = sanitizeOptionalText(request.getCategory(), 100);
        String sanitizedReadTime = sanitizeOptionalText(request.getReadTime(), 50);
        List<String> sanitizedImages = sanitizeMediaUrlList(request.getImages(), 2048);
        List<String> sanitizedTags = sanitizeStringList(request.getTags(), 60);

        // Update post fields
        post.setTitle(sanitizedTitle);
        post.setContent(sanitizedContent);
        post.setCategory(sanitizedCategory);
        post.setReadTime(sanitizedReadTime);
        post.setImages(sanitizedImages);
        post.setTags(sanitizedTags);
        post.setUpdatedAt(LocalDateTime.now());

        Post saved = postRepository.save(post);
        return convertToDTO(saved, user);
    }

    @Transactional
    public void deletePost(Long id, String email) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (Boolean.TRUE.equals(user.getBanned()) && user.getRole() != com.blog._blog.entity.Role.ADMIN) {
            throw new RuntimeException("You are banned and cannot delete posts");
        }

        if (!post.getAuthor().getId().equals(user.getId()) && user.getRole() != com.blog._blog.entity.Role.ADMIN) {
            throw new RuntimeException("Unauthorized");
        }

        // Delete all reports associated with the post
        reportRepository.deleteByReportedPostId(post.getId());

        postRepository.delete(post);
    }

    @Transactional
    public PostDTO toggleHidden(Long postId, String email) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (Boolean.TRUE.equals(user.getBanned())) {
            throw new RuntimeException("You are banned and cannot perform this action");
        }

        boolean isOwner = post.getAuthor().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == com.blog._blog.entity.Role.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new RuntimeException("Unauthorized");
        }

        post.setHidden(!post.isHidden());
        Post saved = postRepository.save(post);
        return convertToDTO(saved, user);
    }

    @Transactional
    public PostDTO toggleLike(Long postId, String email) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (Boolean.TRUE.equals(user.getBanned())) {
            throw new RuntimeException("You are banned and cannot like posts");
        }

        if (post.getLikes().contains(user)) {
            post.getLikes().remove(user);
        } else {
            post.getLikes().add(user);
            notificationService.createNotification(post.getAuthor(), user, NotificationType.LIKE, post.getId());
        }

        Post saved = postRepository.save(post);
        return convertToDTO(saved, user);
    }

    @Transactional
    public CommentDTO toggleCommentLike(Long commentId, String email) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (Boolean.TRUE.equals(user.getBanned())) {
            throw new RuntimeException("You are banned and cannot like comments");
        }

        if (comment.getLikes().contains(user)) {
            comment.getLikes().remove(user);
        } else {
            comment.getLikes().add(user);
            // Optionally notify comment author
        }

        Comment saved = commentRepository.save(comment);
        return convertToCommentDTO(saved, user);
    }

    @Transactional
    public void deleteComment(Long commentId, String email) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (Boolean.TRUE.equals(user.getBanned()) && user.getRole() != com.blog._blog.entity.Role.ADMIN) {
            throw new RuntimeException("You are banned and cannot delete comments");
        }

        boolean isCommentOwner = comment.getAuthor().getId().equals(user.getId());
        boolean isPostOwner = comment.getPost() != null && comment.getPost().getAuthor().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == com.blog._blog.entity.Role.ADMIN;

        if (!isCommentOwner && !isPostOwner && !isAdmin) {
            throw new RuntimeException("Unauthorized");
        }

        commentRepository.delete(comment);
    }

    @Transactional
    public CommentDTO addComment(Long postId, CreateCommentRequest request, String email) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (Boolean.TRUE.equals(user.getBanned())) {
            throw new RuntimeException("You are banned and cannot comment");
        }

        String sanitizedComment = sanitizeRequiredText(request.getContent(), "Comment", 1, 1000);

        Comment comment = Comment.builder()
                .content(sanitizedComment)
                .author(user)
                .post(post)
                .build();

        Comment saved = commentRepository.save(comment);
        notificationService.createNotification(post.getAuthor(), user, NotificationType.COMMENT, post.getId());
        return convertToCommentDTO(saved, user);
    }

    @Transactional(readOnly = true)
    public List<CommentDTO> getComments(Long postId, String currentUserEmail) {
        User currentUser = currentUserEmail != null ? userRepository.findByEmail(currentUserEmail).orElse(null) : null;
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        boolean isOwner = currentUser != null && post.getAuthor().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser != null && currentUser.getRole() == com.blog._blog.entity.Role.ADMIN;
        if (post.isHidden() && !isOwner && !isAdmin) {
            throw new RuntimeException("Post not found");
        }

        return commentRepository.findByPostIdOrderByCreatedAtDesc(postId).stream()
                .map(comment -> convertToCommentDTO(comment, currentUser))
                .collect(Collectors.toList());
    }

    public PostDTO convertToDTO(Post post, User currentUser) {
        boolean isOwner = currentUser != null && post.getAuthor().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser != null && currentUser.getRole() == com.blog._blog.entity.Role.ADMIN;

        return PostDTO.builder()
                .id(post.getId())
                .user(convertToUserSummary(post.getAuthor()))
                .time(formatTimeAgo(post.getCreatedAt()))
                .readTime(post.getReadTime())
                .title(post.getTitle())
                .content(post.getContent())
                .images(post.getImages())
                .category(post.getCategory())
                .likes(post.getLikes().size())
                .comments(post.getComments().size())
                .tags(post.getTags())
                .isLiked(currentUser != null && post.getLikes().contains(currentUser))
                .canEdit(isOwner)
                .canDelete(isOwner || isAdmin)
                .reportsCount((int) reportRepository.countByReportedPostId(post.getId()))
                .hidden(post.isHidden())
                .createdAt(post.getCreatedAt())
                .build();
    }

    private CommentDTO convertToCommentDTO(Comment comment, User currentUser) {
        boolean isOwner = currentUser != null && comment.getAuthor().getId().equals(currentUser.getId());
        boolean isPostOwner = currentUser != null && comment.getPost() != null
                && comment.getPost().getAuthor().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser != null && currentUser.getRole() == com.blog._blog.entity.Role.ADMIN;

        return CommentDTO.builder()
                .id(comment.getId())
                .user(convertToUserSummary(comment.getAuthor()))
                .content(comment.getContent())
                .time(formatTimeAgo(comment.getCreatedAt()))
                .likes(comment.getLikes().size())
                .isLiked(currentUser != null && comment.getLikes().contains(currentUser))
                .canDelete(isOwner || isPostOwner || isAdmin)
                .createdAt(comment.getCreatedAt())
                .build();
    }

    private UserSummaryDTO convertToUserSummary(User user) {
        return UserSummaryDTO.builder()
                .id(Long.valueOf(user.getId()))
                .name(user.getFirstname() + " " + user.getLastname())
                .handle("@" + user.getEmail().split("@")[0])
                .avatar(user.getAvatar())
                .role(user.getRole().name())
                .build();
    }

    private String sanitizeRequiredText(String value, String fieldName, int minLen, int maxLen) {
        String sanitized = HtmlSanitizer.sanitizeAndTrimText(value);
        if (sanitized == null || sanitized.isEmpty()) {
            throw new IllegalArgumentException(fieldName + " is required");
        }
        if (sanitized.length() < minLen || sanitized.length() > maxLen) {
            throw new IllegalArgumentException(
                    fieldName + " must be between " + minLen + " and " + maxLen + " characters");
        }
        return sanitized;
    }

    private String sanitizeRequiredContent(String value, int minLen) {
        String sanitizedHtml = HtmlSanitizer.sanitize(value);
        String plainText = HtmlSanitizer.sanitizeAndTrimText(value);
        if (plainText == null || plainText.isEmpty()) {
            throw new IllegalArgumentException("Content is required");
        }
        if (plainText.length() < minLen) {
            throw new IllegalArgumentException("Content must be at least " + minLen + " characters");
        }
        return sanitizedHtml != null ? sanitizedHtml.trim() : null;
    }

    private String sanitizeOptionalText(String value, int maxLen) {
        String sanitized = HtmlSanitizer.sanitizeAndTrimText(value);
        if (sanitized == null || sanitized.isEmpty()) {
            return null;
        }
        return sanitized.length() > maxLen ? sanitized.substring(0, maxLen) : sanitized;
    }

    private List<String> sanitizeStringList(List<String> values, int maxLen) {
        if (values == null) {
            return null;
        }
        return values.stream()
                .map(HtmlSanitizer::sanitizeAndTrimText)
                .filter(value -> value != null && !value.isEmpty())
                .map(value -> value.length() > maxLen ? value.substring(0, maxLen) : value)
                .collect(Collectors.toList());
    }

    private List<String> sanitizeMediaUrlList(List<String> values, int maxLen) {
        List<String> sanitized = sanitizeStringList(values, maxLen);
        if (sanitized == null) {
            return null;
        }

        for (String value : sanitized) {
            if (!isAllowedMediaUrl(value)) {
                throw new IllegalArgumentException("Invalid media URL detected");
            }
        }
        return sanitized;
    }

    private boolean isAllowedMediaUrl(String value) {
        if (value == null || value.isBlank()) {
            return false;
        }

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

    private String formatTimeAgo(LocalDateTime dateTime) {
        Duration duration = Duration.between(dateTime, LocalDateTime.now());
        long seconds = duration.getSeconds();

        if (seconds < 60)
            return "Just now";
        if (seconds < 3600)
            return (seconds / 60) + "m ago";
        if (seconds < 86400)
            return (seconds / 3600) + "h ago";
        if (seconds < 604800)
            return (seconds / 86400) + "d ago";
        return dateTime.toLocalDate().toString();
    }
}
