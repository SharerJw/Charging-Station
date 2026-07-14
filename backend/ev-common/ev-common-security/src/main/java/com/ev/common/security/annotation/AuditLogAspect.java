package com.ev.common.security.annotation;

import com.ev.common.core.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;

/**
 * 审计日志 AOP
 */
@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class AuditLogAspect {

    @Around("@annotation(auditLog)")
    public Object around(ProceedingJoinPoint joinPoint, AuditLog auditLog) throws Throwable {
        long start = System.currentTimeMillis();
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

        String ip = "";
        String uri = "";
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            ip = getClientIp(request);
            uri = request.getRequestURI();
        }

        try {
            Object result = joinPoint.proceed();
            long cost = System.currentTimeMillis() - start;

            log.info("审计日志: action={}, resource={}, userId={}, username={}, ip={}, uri={}, cost={}ms, success=true",
                    auditLog.action(), auditLog.resource(),
                    SecurityUtils.getUserId(), SecurityUtils.getUsername(),
                    ip, uri, cost);

            return result;
        } catch (Exception e) {
            long cost = System.currentTimeMillis() - start;
            log.warn("审计日志: action={}, resource={}, userId={}, ip={}, uri={}, cost={}ms, error={}",
                    auditLog.action(), auditLog.resource(),
                    SecurityUtils.getUserId(), ip, uri, cost, e.getMessage());
            throw e;
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip.contains(",") ? ip.split(",")[0].trim() : ip;
    }
}
