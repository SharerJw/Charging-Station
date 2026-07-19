package com.ev.common.core.aspect;

import com.ev.common.core.annotation.RateLimit;
import com.ev.common.core.exception.BizException;
import com.ev.common.core.service.RateLimitService;
import com.ev.common.core.util.TenantContext;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Method;
import java.lang.reflect.Parameter;

/**
 * 限流切面
 * 拦截 @RateLimit 注解的方法，执行限流检查
 */
@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class RateLimitAspect {

    private final RateLimitService rateLimitService;

    private final ExpressionParser parser = new SpelExpressionParser();

    @Around("@annotation(rateLimit)")
    public Object around(ProceedingJoinPoint point, RateLimit rateLimit) throws Throwable {
        // 1. 生成限流 key
        String key = generateKey(point, rateLimit);

        // 2. 执行限流检查
        boolean allowed;
        if (rateLimit.type() == RateLimit.LimitType.SLIDING_WINDOW) {
            allowed = rateLimitService.tryAcquireSlidingWindow(
                    key, (int) rateLimit.permitsPerSecond(), rateLimit.windowSeconds());
        } else {
            allowed = rateLimitService.tryAcquireTokenBucket(
                    key, rateLimit.permitsPerSecond(), rateLimit.burstCapacity());
        }

        // 3. 超限则拒绝
        if (!allowed) {
            HttpServletRequest request = getRequest();
            String uri = request != null ? request.getRequestURI() : "unknown";
            log.warn("请求被限流: key={}, uri={}", key, uri);
            throw BizException.rateLimitExceeded();
        }

        // 4. 放行
        return point.proceed();
    }

    /**
     * 生成限流 key
     * 格式: rate_limit:{keyPrefix}:{dimension}:{identifier}
     */
    private String generateKey(ProceedingJoinPoint point, RateLimit rateLimit) {
        StringBuilder keyBuilder = new StringBuilder("rate_limit:");

        // 添加自定义前缀
        if (!rateLimit.keyPrefix().isEmpty()) {
            keyBuilder.append(rateLimit.keyPrefix()).append(":");
        }

        HttpServletRequest request = getRequest();

        switch (rateLimit.dimension()) {
            case IP:
                keyBuilder.append("ip:").append(getClientIp(request));
                break;
            case USER:
                Long userId = TenantContext.getUserId();
                keyBuilder.append("user:").append(userId != null ? userId : "anonymous");
                break;
            case API:
                String uri = request != null ? request.getRequestURI() : "unknown";
                keyBuilder.append("api:").append(uri);
                break;
            case CUSTOM:
                String customKey = resolveCustomKey(point, rateLimit.keyExpression());
                keyBuilder.append("custom:").append(customKey);
                break;
        }

        return keyBuilder.toString();
    }

    /**
     * 获取客户端真实 IP
     */
    private String getClientIp(HttpServletRequest request) {
        if (request == null) {
            return "unknown";
        }

        String ip = request.getHeader("X-Forwarded-For");
        if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
            // 多级代理时取第一个
            return ip.split(",")[0].trim();
        }

        ip = request.getHeader("Proxy-Client-IP");
        if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
            return ip;
        }

        ip = request.getHeader("WL-Proxy-Client-IP");
        if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
            return ip;
        }

        return request.getRemoteAddr();
    }

    /**
     * 解析 SpEL 自定义 key 表达式
     */
    private String resolveCustomKey(ProceedingJoinPoint point, String expression) {
        if (expression == null || expression.isEmpty()) {
            return "default";
        }

        StandardEvaluationContext context = new StandardEvaluationContext();

        // 将方法参数注入 SpEL 上下文
        MethodSignature signature = (MethodSignature) point.getSignature();
        Method method = signature.getMethod();
        Parameter[] parameters = method.getParameters();
        Object[] args = point.getArgs();

        for (int i = 0; i < parameters.length && i < args.length; i++) {
            context.setVariable(parameters[i].getName(), args[i]);
        }

        try {
            Object value = parser.parseExpression(expression).getValue(context);
            return value != null ? value.toString() : "null";
        } catch (Exception e) {
            log.warn("SpEL 表达式解析失败: expression={}, error={}", expression, e.getMessage());
            return "parse_error";
        }
    }

    private HttpServletRequest getRequest() {
        try {
            ServletRequestAttributes attributes =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            return attributes != null ? attributes.getRequest() : null;
        } catch (Exception e) {
            return null;
        }
    }
}
