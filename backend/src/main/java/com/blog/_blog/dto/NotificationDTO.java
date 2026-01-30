package com.blog._blog.dto;

import com.blog._blog.entity.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    private Long id;
    private String actorName;
    private String actorAvatar;
    private Integer actorId; // ID of the user who triggered the notification
    private NotificationType type;
    private Long entityId; // e.g. Post ID
    @com.fasterxml.jackson.annotation.JsonProperty("isRead")
    private boolean isRead;
    private LocalDateTime createdAt;
    private String message; // Constructed message like "John liked your post"
}
