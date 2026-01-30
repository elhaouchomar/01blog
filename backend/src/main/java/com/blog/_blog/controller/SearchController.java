package com.blog._blog.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final com.blog._blog.service.SearchService searchService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "all") String filter,
            @RequestParam(defaultValue = "10") int limit,
            Authentication authentication) {

        String currentUserEmail = authentication != null ? authentication.getName() : null;
        Map<String, Object> results = searchService.search(q, filter, limit, currentUserEmail);
        return ResponseEntity.ok(results);
    }
}