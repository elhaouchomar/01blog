package com.blog._blog.service;

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
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
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

        return postRepository.findAllByOrderByCreatedAtDesc(org.springframework.data.domain.PageRequest.of(page, size))
                .stream()
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

        return postRepository
                .findByAuthorIdOrderByCreatedAtDesc(userId, org.springframework.data.domain.PageRequest.of(page, size))
                .stream()
                .map(post -> convertToDTO(post, currentUser))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PostDTO getPost(Long id, String currentUserEmail) {
        User currentUser = currentUserEmail != null ? userRepository.findByEmail(currentUserEmail).orElse(null) : null;

        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        return convertToDTO(post, currentUser);
    }

    @Transactional
    public PostDTO createPost(CreatePostRequest request, String email) {
        User author = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Post post = Post.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .category(request.getCategory())
                .readTime(request.getReadTime())
                .images(request.getImages())
                .tags(request.getTags())
                .author(author)
                .build();

        Post saved = postRepository.save(post);

        // Notify followers
        if (author.getFollowers() != null) {
            author.getFollowers().forEach(follower -> {
                notificationService.createNotification(follower, author, NotificationType.NEW_POST, saved.getId());
            });
        }

        return convertToDTO(saved, author);
    }

    @Transactional
    public PostDTO updatePost(Long id, CreatePostRequest request, String email) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Only post owner can edit
        if (!post.getAuthor().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        // Update post fields
        post.setTitle(request.getTitle());
        post.setContent(request.getContent());
        post.setCategory(request.getCategory());
        post.setReadTime(request.getReadTime());
        post.setImages(request.getImages());
        post.setTags(request.getTags());
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

        if (!post.getAuthor().getId().equals(user.getId()) && user.getRole() != com.blog._blog.entity.Role.ADMIN) {
            throw new RuntimeException("Unauthorized");
        }

        postRepository.delete(post);
    }

    @Transactional
    public PostDTO toggleLike(Long postId, String email) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

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
    public CommentDTO addComment(Long postId, CreateCommentRequest request, String email) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Comment comment = Comment.builder()
                .content(request.getContent())
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
                .createdAt(post.getCreatedAt())
                .build();
    }

    private CommentDTO convertToCommentDTO(Comment comment, User currentUser) {
        return CommentDTO.builder()
                .id(comment.getId())
                .user(convertToUserSummary(comment.getAuthor()))
                .content(comment.getContent())
                .time(formatTimeAgo(comment.getCreatedAt()))
                .likes(comment.getLikes().size())
                .isLiked(currentUser != null && comment.getLikes().contains(currentUser))
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
