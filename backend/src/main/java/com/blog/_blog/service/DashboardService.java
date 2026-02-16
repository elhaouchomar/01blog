package com.blog._blog.service;

import com.blog._blog.dto.DashboardStatsDTO;
import com.blog._blog.dto.PlatformActivityDTO;
import com.blog._blog.dto.ReportedUserDTO;
import com.blog._blog.entity.Report;
import com.blog._blog.entity.User;
import com.blog._blog.repository.PostRepository;
import com.blog._blog.repository.ReportRepository;
import com.blog._blog.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

        private final UserRepository userRepository;
        private final PostRepository postRepository;
        private final ReportRepository reportRepository;

        public DashboardStatsDTO getDashboardStats(String requesterEmail) {
                User requester = userRepository.findByEmail(requesterEmail)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                if (requester.getRole() != com.blog._blog.entity.Role.ADMIN) {
                        throw new RuntimeException("Unauthorized");
                }

                LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);

                List<PlatformActivityDTO> activity = postRepository.findPostActivity(thirtyDaysAgo)
                                .stream()
                                .map(obj -> PlatformActivityDTO.builder()
                                                .date(obj[0].toString())
                                                .count(((Number) obj[1]).longValue())
                                                .build())
                                .collect(Collectors.toList());

                List<Object[]> mostReportedUsersRaw = reportRepository.findMostReportedUsers()
                                .stream()
                                .limit(5)
                                .collect(Collectors.toList());

                List<Integer> mostReportedUserIds = mostReportedUsersRaw.stream()
                                .map(obj -> ((Number) obj[0]).intValue())
                                .collect(Collectors.toList());

                Map<Integer, User> usersById = userRepository.findAllById(mostReportedUserIds).stream()
                                .collect(Collectors.toMap(User::getId, user -> user));

                List<ReportedUserDTO> mostReportedUsers = mostReportedUsersRaw.stream()
                                .map(obj -> {
                                        Integer userId = ((Number) obj[0]).intValue();
                                        User user = usersById.get(userId);
                                        if (user == null) {
                                                return null;
                                        }

                                        String fullName = ((user.getFirstname() == null ? "" : user.getFirstname()) + " "
                                                        + (user.getLastname() == null ? "" : user.getLastname())).trim();
                                        String username = user.getEmail() != null ? user.getEmail().split("@")[0] : "";

                                        return ReportedUserDTO.builder()
                                                        .id(user.getId())
                                                        .name(fullName)
                                                        .username(username)
                                                        .avatar(user.getAvatar())
                                                        .reportCount(((Number) obj[1]).longValue())
                                                        .status(Boolean.TRUE.equals(user.getBanned()) ? "Banned"
                                                                        : "Active")
                                                        .build();
                                })
                                .filter(Objects::nonNull)
                                .collect(Collectors.toList());

                return DashboardStatsDTO.builder()
                                .totalUsers(userRepository.count())
                                .totalPosts(postRepository.count())
                                .totalReports(reportRepository.count())
                                .bannedUsers(userRepository.countByBanned(true))
                                .pendingReports(reportRepository.countByStatus(Report.ReportStatus.PENDING))
                                .activity(activity)
                                .mostReportedUsers(mostReportedUsers)
                                .build();
        }
}
