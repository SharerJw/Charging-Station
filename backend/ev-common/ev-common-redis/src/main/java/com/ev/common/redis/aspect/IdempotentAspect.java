package com.ev.common.redis.aspect;

import com.ev.common.core.exception.BizException;
import com.ev.common.redis.util.RedisLock;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import java.util.concurrent.TimeUnit;

/**
 * 幂等性切面 - 通过请求头 Idempotency-Key 实现
 */
@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class IdempotentAspect {

    private final RedisLock redisLock;

    private static final String IDEMPOTENCY_PREFIX = "idempotent:";
    private static final long EXPIRE_SECONDS = 86400; // 24小时

    @Around("@annotation(com.ev.common.redis.aspect.Idempotent)")
    public Object around(ProceedingJoinPoint joinPoint) throws Throwable {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null) {
            return joinPoint.proceed();
        }

        HttpServletRequest request = attributes.getRequest();
        String idempotencyKey = request.getHeader("Idempotency-Key");
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return joinPoint.proceed();
        }

        String redisKey = IDEMPOTENCY_PREFIX + idempotencyKey;

        // 检查是否已处理
        Object cached = redisLock.get(redisKey);
        if (cached != null) {
            log.info("幂等性拦截: key={}", idempotencyKey);
            throw BizException.duplicateOperation();
        }

        // 标记为处理中
        redisLock.set(redisKey, "processing", EXPIRE_SECONDS, TimeUnit.SECONDS);

        try {
            Object result = joinPoint.proceed();
            // 标记为已完成
            redisLock.set(redisKey, "done", EXPIRE_SECONDS, TimeUnit.SECONDS);
            return result;
        } catch (Exception e) {
            // 失败时删除标记，允许重试
            redisLock.delete(redisKey);
            throw e;
        }
    }
}
