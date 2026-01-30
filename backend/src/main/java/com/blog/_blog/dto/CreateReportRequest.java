package com.blog._blog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateReportRequest {
    @javax.validation.constraints.NotBlank(message = "Reason is required")
    @javax.validation.constraints.Size(min = 10, max = 500, message = "Reason must be between 10 and 500 characters")
    private String reason;
    private Integer reportedUserId;
    private Long reportedPostId;
}
