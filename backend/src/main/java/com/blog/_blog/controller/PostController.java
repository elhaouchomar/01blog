package com.blog._blog.controller;

import com.blog._blog.dto.*;
import com.blog._blog.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/v1/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final com.blog._blog.service.FileStorageService fileStorageService;

    @PostMapping("/upload")
    public ResponseEntity<List<String>> uploadFiles(
            @RequestParam("files") org.springframework.web.multipart.MultipartFile[] files) {
        List<String> fileNames = java.util.Arrays.stream(files)
                .map(fileStorageService::storeFile)
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(fileNames);
    }

    @GetMapping
    public ResponseEntity<List<PostDTO>> getAllPosts(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        String email = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(postService.getAllPosts(email, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostDTO> getPost(@PathVariable Long id, Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(postService.getPost(id, email));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<PostDTO>> getUserPosts(
            @PathVariable Integer userId,
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        String email = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(postService.getUserPosts(userId, email, page, size));
    }

    @PostMapping
    public ResponseEntity<PostDTO> createPost(@Valid @RequestBody CreatePostRequest request,
            Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(postService.createPost(request, email));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PostDTO> updatePost(@PathVariable Long id, @Valid @RequestBody CreatePostRequest request,
            Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(postService.updatePost(id, request, email));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id, Authentication authentication) {
        String email = authentication.getName();
        postService.deletePost(id, email);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<PostDTO> toggleLike(@PathVariable Long id, Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(postService.toggleLike(id, email));
    }

    @PostMapping("/{id}/comment")
    public ResponseEntity<CommentDTO> addComment(@PathVariable Long id,
            @Valid @RequestBody CreateCommentRequest request,
            Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(postService.addComment(id, request, email));
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<List<CommentDTO>> getComments(@PathVariable Long id, Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(postService.getComments(id, email));
    }

    @PostMapping("/comment/{id}/like")
    public ResponseEntity<CommentDTO> toggleCommentLike(@PathVariable Long id, Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(postService.toggleCommentLike(id, email));
    }
}
