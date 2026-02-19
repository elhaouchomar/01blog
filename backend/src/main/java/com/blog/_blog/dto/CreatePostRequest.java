package com.blog._blog.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePostRequest {
    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 150, message = "Title must be between 3 and 150 characters")
    private String title;

    @NotBlank(message = "Content is required")
    @Size(min = 3, max = 10000, message = "Content must be between 3 and 10000 characters")
    private String content;

    @Size(max = 100, message = "Category must be at most 100 characters")
    private String category;

    @Size(max = 50, message = "Read time must be at most 50 characters")
    private String readTime;

    @Size(max = 8, message = "A post can contain at most 8 media items")
    private List<String> images;

    @Size(max = 10, message = "A post can contain at most 10 tags")
    private List<String> tags;
}
