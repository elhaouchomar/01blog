package com.blog._blog.repository;

import com.blog._blog.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying; // Import Modifying
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional; // Import Transactional

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {

    long countByStatus(Report.ReportStatus status);

    long countByReportedPostId(Long reportedPostId);

    @Query("SELECT r.reportedUser.id, COUNT(r) FROM Report r WHERE r.reportedUser IS NOT NULL GROUP BY r.reportedUser.id ORDER BY COUNT(r) DESC")
    List<Object[]> findMostReportedUsers();

    @Modifying
    @Transactional
    @Query("DELETE FROM Report r WHERE r.reportedPost.id = :reportedPostId") // Explicit DELETE query
    void deleteByReportedPostId(Long reportedPostId); // New method to delete reports by reportedPostId

    @Modifying
    @Transactional
    @Query("DELETE FROM Report r WHERE r.reportedPost.id IN (SELECT p.id FROM Post p WHERE p.author = :author)")
    void deleteByReportedPostAuthor(com.blog._blog.entity.User author);

    boolean existsByReporterAndReportedUser(com.blog._blog.entity.User reporter, com.blog._blog.entity.User reportedUser);

    boolean existsByReporterAndReportedPost(com.blog._blog.entity.User reporter, com.blog._blog.entity.Post reportedPost);

    boolean existsByReporterIdAndReportedUserId(Integer reporterId, Integer reportedUserId);

    boolean existsByReporterIdAndReportedPostId(Integer reporterId, Long reportedPostId);

    void deleteByReporter(com.blog._blog.entity.User reporter);

    void deleteByReportedUser(com.blog._blog.entity.User reportedUser);
}
