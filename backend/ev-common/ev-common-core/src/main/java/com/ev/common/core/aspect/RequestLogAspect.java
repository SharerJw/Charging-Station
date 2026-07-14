package com.ev.common.core.aspect;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;

/**
 * 请求日志 AOP - Controller 方法级耗时记录
 */
@Slf4j
@Aspect
@Component
public class RequestLogAspect {

    @Around("execution(* com.ev..controller..*(..))")
    public Object logRequest(ProceedingJoinPoint joinPoint) throws Throwable {
        long start = System.nanoTime();
        String method = joinPoint.getSignature().getDeclaringType().getSimpleName() + "." + joinPoint.getSignature().getName();
        String traceId = MDC.get("traceId");

        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        String uri = "";
        String httpMethod = "";
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            uri = request.getRequestURI();
            httpMethod = request.getMethod();
        }

        log.info(">>> {} {} {} traceId={}", httpMethod, uri, method, traceId);

        try {
            Object result = joinPoint.proceed();
            long costMs = (System.nanoTime() - start) / 1_000_000;

            if (costMs > 1000) {
                log.warn("<<< {} {} cost={}ms [慢请求]", httpMethod, uri, costMs);
            } else {
                log.info("<<< {} {} cost={}ms", httpMethod, uri, costMs);
            }
            return result;
        } catch (Exception e) {
            long costMs = (System.nanoTime() - start) / 1_000_000;
            log.error("<<< {} {} cost={}ms error={}", httpMethod, uri, costMs, e.getMessage());
            throw e;
        }
    }
}
