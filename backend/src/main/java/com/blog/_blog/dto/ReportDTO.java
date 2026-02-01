package com.blog._blog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportDTO {
    private Long id;
    private String reason;
    private UserSummaryDTO reporter;
    private UserSummaryDTO reportedUser;
    private Long reportedPostId;
    private String reportedPostTitle;
    private String reportedPostImage;
    private UserSummaryDTO reportedPostAuthor;
    private String status;
    private LocalDateTime createdAt;
}
