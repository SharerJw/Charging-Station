package com.ev.common.redis.filter;

import com.ev.common.core.util.TenantContext;
import com.ev.common.redis.service.RateLimitService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * 全局默认限流过滤器
 * 对所有 /api/** 请求进行全局默认限流（100 QPS/IP）
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class GlobalRateLimitFilter extends OncePerRequestFilter {

    private final RateLimitService rateLimitService;

    /**
     * 全局限流 key 前缀
     */
    private static final String GLOBAL_RATE_LIMIT_PREFIX = "global_rate_limit";

    /**
     * 全局默认 QPS
     */
    private static final double DEFAULT_QPS = 100.0;

    /**
     * 全局默认突发容量
     */
    private static final int DEFAULT_BURST_CAPACITY = 200;

    /**
     * 需要排除的路径（不需要全局限流）
     */
    private static final String[] EXCLUDE_PATHS = {
            "/api/auth/login",
            "/api/v1/auth/login",
            "/api/v1/ops/auth/login",
            "/api/simulator/",
            "/actuator/",
            "/doc.html",
            "/v3/api-docs/",
            "/swagger-resources/",
            "/webjars/"
    };

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String uri = request.getRequestURI();

        // 检查是否需要排除
        if (shouldExclude(uri)) {
            filterChain.doFilter(request, response);
            return;
        }

        // 生成全局限流 key
        String clientIp = getClientIp(request);
        String key = rateLimitService.generateKey(GLOBAL_RATE_LIMIT_PREFIX, "IP", clientIp);

        // 尝试获取令牌
        boolean allowed = rateLimitService.tryAcquire(key, DEFAULT_QPS, DEFAULT_BURST_CAPACITY);

        if (!allowed) {
            log.warn("全局限流触发 - URI: {}, IP: {}", uri, clientIp);
            sendRateLimitResponse(response);
            return;
        }

        filterChain.doFilter(request, response);
    }

    /**
     * 判断是否需要排除该路径
     *
     * @param uri 请求 URI
     * @return true 表示需要排除
     */
    private boolean shouldExclude(String uri) {
        for (String excludePath : EXCLUDE_PATHS) {
            if (uri.startsWith(excludePath)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 发送限流响应
     *
     * @param response HTTP 响应
     * @throws IOException IO 异常
     */
    private void sendRateLimitResponse(HttpServletResponse response) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        String jsonResponse = """
                {
                    "code": 1006,
                    "message": "请求过于频繁，请稍后再试",
                    "success": false
                }
                """;

        response.getWriter().write(jsonResponse);
    }

    /**
     * 获取客户端真实 IP 地址
     *
     * @param request HTTP 请求
     * @return 客户端 IP
     */
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }

        // 多级代理时，X-Forwarded-For 可能包含多个 IP，取第一个
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }

        return ip;
    }
}