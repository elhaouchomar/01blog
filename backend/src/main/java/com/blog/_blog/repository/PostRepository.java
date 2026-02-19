package com.blog._blog.repository;

import com.blog._blog.entity.Post;
import com.blog._blog.entity.User; // Import User entity
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Collection;

public interface PostRepository extends JpaRepository<Post, Long> {

        List<Post> findByAuthorIdOrderByCreatedAtDesc(Integer authorId);

        org.springframework.data.domain.Page<Post> findByAuthorIdOrderByCreatedAtDesc(Integer authorId,
                        org.springframework.data.domain.Pageable pageable);

        List<Post> findAllByOrderByCreatedAtDesc();

        org.springframework.data.domain.Page<Post> findAllByOrderByCreatedAtDesc(
                        org.springframework.data.domain.Pageable pageable);

        org.springframework.data.domain.Page<Post> findByHiddenFalseOrderByCreatedAtDesc(
                        org.springframework.data.domain.Pageable pageable);

        org.springframework.data.domain.Page<Post> findByAuthorInAndHiddenFalseOrderByCreatedAtDesc(
                        Collection<User> authors,
                        org.springframework.data.domain.Pageable pageable);

        org.springframework.data.domain.Page<Post> findByAuthorIdInAndHiddenFalseOrderByCreatedAtDesc(
                        Collection<Integer> authorIds,
                        org.springframework.data.domain.Pageable pageable);

        org.springframework.data.domain.Page<Post> findByAuthorIdAndHiddenFalseOrderByCreatedAtDesc(Integer authorId,
                        org.springframework.data.domain.Pageable pageable);

        @Query("SELECT p FROM Post p WHERE LOWER(p.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(p.category) LIKE LOWER(CONCAT('%', :query, '%'))")
        List<Post> searchByTitleOrCategory(@Param("query") String query);

        @Query("SELECT CAST(p.createdAt as date), COUNT(p) FROM Post p WHERE p.createdAt >= :startDate GROUP BY CAST(p.createdAt as date) ORDER BY CAST(p.createdAt as date)")
        List<Object[]> findPostActivity(@Param("startDate") java.time.LocalDateTime startDate);

        long countByAuthorId(Integer authorId);

        void deleteByAuthor(User author);
}
