package com.blog._blog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostDTO {
    private Long id;
    private UserSummaryDTO user;
    private String time;
    private String readTime;
    private String title;
    private String content;
    private List<String> images;
    private String category;
    private Integer likes;
    private Integer comments;
    private List<String> tags;
    private Boolean isLiked;
    private Boolean canEdit; // True if current user owns this post
    private Boolean canDelete; // True if owner OR admin
    private Integer reportsCount;
    private Boolean hidden;
    private LocalDateTime createdAt;
}
