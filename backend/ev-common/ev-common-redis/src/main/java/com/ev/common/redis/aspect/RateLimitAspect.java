package com.ev.common.redis.aspect;

import com.ev.common.core.exception.BizException;
import com.ev.common.core.util.TenantContext;
import com.ev.common.redis.service.RateLimitService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * 限流切面 - 基于 @RateLimit 注解实现 API 限流
 */
@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class RateLimitAspect {

    private final RateLimitService rateLimitService;

    /**
     * 限流 key 前缀
     */
    private static final String RATE_LIMIT_PREFIX = "rate_limit";

    @Around("@annotation(rateLimit)")
    public Object around(ProceedingJoinPoint joinPoint, RateLimit rateLimit) throws Throwable {
        // 获取请求信息
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null) {
            return joinPoint.proceed();
        }

        HttpServletRequest request = attributes.getRequest();

        // 生成限流 key
        String key = generateKey(rateLimit, request);

        // 尝试获取令牌
        boolean allowed = rateLimitService.tryAcquire(key, rateLimit.permitsPerSecond(), rateLimit.burstCapacity());

        if (!allowed) {
            log.warn("API 限流触发 - URI: {}, Key: {}, QPS: {}, Capacity: {}",
                    request.getRequestURI(), key, rateLimit.permitsPerSecond(), rateLimit.burstCapacity());
            throw BizException.rateLimitExceeded();
        }

        return joinPoint.proceed();
    }

    /**
     * 生成限流 key
     *
     * @param rateLimit 限流注解
     * @param request   HTTP 请求
     * @return 限流 key
     */
    private String generateKey(RateLimit rateLimit, HttpServletRequest request) {
        String prefix = rateLimit.key();
        if (prefix == null || prefix.isEmpty()) {
            prefix = request.getRequestURI();
        }

        String identifier;

        switch (rateLimit.limitType()) {
            case USER -> {
                Long userId = TenantContext.getUserId();
                if (userId == null) {
                    // 用户维度限流但未登录，降级为 IP 限流
                    identifier = getClientIp(request);
                } else {
                    identifier = String.valueOf(userId);
                }
            }
            case GLOBAL -> identifier = "global";
            default -> identifier = getClientIp(request);
        }

        return rateLimitService.generateKey(prefix, rateLimit.limitType().name(), identifier);
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