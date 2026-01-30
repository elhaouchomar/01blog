package com.blog._blog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import javax.validation.constraints.Size;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Integer id;
    @Size(min = 2, max = 50, message = "First name must be between 2 and 50 characters")
    private String firstname;

    @Size(min = 2, max = 50, message = "Last name must be between 2 and 50 characters")
    private String lastname;

    private String email;
    private String role;
    private String avatar;
    private String cover;

    @Size(max = 500, message = "Bio cannot exceed 500 characters")
    private String bio;
    private java.time.LocalDateTime createdAt;
    private String username; // For frontend compatibility
    private String name;
    private String handle;
    private Boolean subscribed;
    private Boolean isFollowing;
    private Integer followersCount;
    private Integer followingCount;
    private Boolean banned;
    private Integer postCount;
}
