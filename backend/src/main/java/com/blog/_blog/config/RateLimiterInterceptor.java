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
    private static final int MAX_REQUESTS_PER_MINUTE = 60;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String clientIp = getClientIp(request);
        long currentTime = System.currentTimeMillis();

        requestCounts.entrySet()
                .removeIf(entry -> currentTime - entry.getValue().lastResetTime > TimeUnit.MINUTES.toMillis(1));

        UserRequestInfo info = requestCounts.computeIfAbsent(clientIp, k -> new UserRequestInfo(currentTime));

        if (info.count.incrementAndGet() > MAX_REQUESTS_PER_MINUTE) {
            System.out.println("❌ Rate limit exceeded for IP: " + clientIp);
            response.setStatus(429); // Too Many Requests
            response.getWriter().write("Too many requests. Please try again in a minute.");
            return false;
        }

        return true;
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
