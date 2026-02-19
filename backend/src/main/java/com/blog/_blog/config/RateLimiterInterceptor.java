package com.blog._blog.config;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class RateLimiterInterceptor implements HandlerInterceptor {

    private final Map<String, UserRequestInfo> requestCounts = new ConcurrentHashMap<>();
    private static final int MAX_WRITE_REQUESTS_PER_MINUTE = 180;
    private static final int MAX_AUTH_MUTATION_REQUESTS_PER_MINUTE = 45;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        String method = request.getMethod();
        if ("OPTIONS".equalsIgnoreCase(method)
                || "GET".equalsIgnoreCase(method)
                || "HEAD".equalsIgnoreCase(method)) {
            return true;
        }

        if ("/api/auth/logout".equals(request.getRequestURI())) {
            return true;
        }

        String clientIp = getClientIp(request);
        String requestPath = request.getRequestURI();
        int limit = resolveLimit(method, requestPath);
        long currentTime = System.currentTimeMillis();

        requestCounts.entrySet()
                .removeIf(entry -> currentTime - entry.getValue().lastResetTime > TimeUnit.MINUTES.toMillis(1));

        String bucketKey = clientIp + "|" + method.toUpperCase() + "|" + normalizePath(requestPath);
        UserRequestInfo info = requestCounts.computeIfAbsent(bucketKey, k -> new UserRequestInfo(currentTime));

        if (info.count.incrementAndGet() > limit) {
            response.setStatus(429); // Too Many Requests
            response.setContentType("application/json");
            response.setHeader("Retry-After", "5");
            response.getWriter().write("{\"message\":\"Too many requests. Please wait a few seconds and try again.\"}");
            return false;
        }

        return true;
    }

    private int resolveLimit(String method, String path) {
        if ("POST".equalsIgnoreCase(method)
                && ("/api/auth/authenticate".equals(path) || "/api/auth/register".equals(path))) {
            return MAX_AUTH_MUTATION_REQUESTS_PER_MINUTE;
        }
        return MAX_WRITE_REQUESTS_PER_MINUTE;
    }

    private String normalizePath(String path) {
        if (path == null || path.isEmpty()) {
            return "/";
        }
        // Keep only first 3 segments to avoid too many small buckets.
        String[] parts = path.split("/");
        StringBuilder normalized = new StringBuilder();
        int count = 0;
        for (String part : parts) {
            if (part == null || part.isEmpty()) continue;
            normalized.append('/').append(part);
            count++;
            if (count >= 3) break;
        }
        return normalized.length() == 0 ? "/" : normalized.toString();
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }

    private static class UserRequestInfo {
        final AtomicInteger count = new AtomicInteger(0);
        final long lastResetTime;

        UserRequestInfo(long lastResetTime) {
            this.lastResetTime = lastResetTime;
        }
    }
}
