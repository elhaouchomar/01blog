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
public class CommentDTO {
    private Long id;
    private UserSummaryDTO user;
    private String content;
    private String time;
    private Integer likes;
    private Boolean isLiked;
    private Boolean canDelete;
    private LocalDateTime createdAt;
}
