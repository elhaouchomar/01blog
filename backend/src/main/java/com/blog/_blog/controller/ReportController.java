package com.blog._blog.controller;

import com.blog._blog.dto.CreateReportRequest;
import com.blog._blog.dto.ReportDTO;
import com.blog._blog.entity.Report;
import com.blog._blog.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @PostMapping
    public ResponseEntity<ReportDTO> createReport(@Valid @RequestBody CreateReportRequest request,
            Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(reportService.createReport(request, email));
    }

    @GetMapping
    public ResponseEntity<List<ReportDTO>> getAllReports(Authentication authentication) {
        return ResponseEntity.ok(reportService.getAllReports(authentication.getName()));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ReportDTO> updateStatus(@PathVariable Long id, @RequestParam Report.ReportStatus status,
            Authentication authentication) {
        return ResponseEntity.ok(reportService.updateStatus(id, status, authentication.getName()));
    }
}
