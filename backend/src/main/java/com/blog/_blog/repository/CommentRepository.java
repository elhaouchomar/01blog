package com.blog._blog.repository;

import com.blog._blog.entity.Comment;
import com.blog._blog.entity.User; // Import User entity
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByPostIdOrderByCreatedAtDesc(Long postId);
    void deleteByAuthor(User author); // New method to delete comments by author
}
