package com.blog._blog.service;

import com.blog._blog.dto.CreateReportRequest;
import com.blog._blog.dto.ReportDTO;
import com.blog._blog.dto.UserSummaryDTO;
import com.blog._blog.entity.Post;
import com.blog._blog.entity.Report;
import com.blog._blog.entity.User;
import com.blog._blog.repository.PostRepository;
import com.blog._blog.repository.ReportRepository;
import com.blog._blog.repository.UserRepository;
import com.blog._blog.util.HtmlSanitizer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;

    public ReportDTO createReport(CreateReportRequest request, String reporterEmail) {
        User reporter = userRepository.findByEmail(reporterEmail).orElseThrow();

        Report report = Report.builder()
                .reason(HtmlSanitizer.sanitizeText(request.getReason()))
                .reporter(reporter)
                .status(Report.ReportStatus.PENDING)
                .build();

        if (request.getReportedUserId() != null) {
            User reportedUser = userRepository.findById(request.getReportedUserId()).orElse(null);
            report.setReportedUser(reportedUser);
        }

        if (request.getReportedPostId() != null) {
            Post reportedPost = postRepository.findById(request.getReportedPostId()).orElse(null);
            report.setReportedPost(reportedPost);
        }

        Report savedReport = reportRepository.save(report);
        return convertToDTO(savedReport);
    }

    public List<ReportDTO> getAllReports(String requesterEmail) {
        checkAdmin(requesterEmail);
        return reportRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public ReportDTO updateStatus(Long id, Report.ReportStatus status, String requesterEmail) {
        checkAdmin(requesterEmail);
        Report report = reportRepository.findById(id).orElseThrow();
        report.setStatus(status);
        return convertToDTO(reportRepository.save(report));
    }

    private void checkAdmin(String email) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getRole() != com.blog._blog.entity.Role.ADMIN) {
            throw new RuntimeException("Unauthorized");
        }
    }

    private ReportDTO convertToDTO(Report report) {
        return ReportDTO.builder()
                .id(report.getId())
                .reason(report.getReason())
                .reporter(mapToUserSummary(report.getReporter()))
                .reportedUser(report.getReportedUser() != null ? mapToUserSummary(report.getReportedUser()) : null)
                .reportedPostId(report.getReportedPost() != null ? report.getReportedPost().getId() : null)
                .reportedPostTitle(report.getReportedPost() != null ? report.getReportedPost().getTitle() : null)
                .reportedPostImage(report.getReportedPost() != null && !report.getReportedPost().getImages().isEmpty()
                        ? report.getReportedPost().getImages().get(0)
                        : null)
                .reportedPostAuthor(
                        report.getReportedPost() != null ? mapToUserSummary(report.getReportedPost().getAuthor())
                                : null)
                .status(report.getStatus().name())
                .createdAt(report.getCreatedAt())
                .build();
    }

    private UserSummaryDTO mapToUserSummary(User user) {
        return UserSummaryDTO.builder()
                .id(user.getId().longValue())
                .name(user.getFirstname() + " " + user.getLastname())
                .handle("@" + user.getEmail().split("@")[0])
                .avatar(user.getAvatar())
                .banned(Boolean.TRUE.equals(user.getBanned()))
                .build();
    }
}
