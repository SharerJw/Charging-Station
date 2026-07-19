package com.ev.common.core.annotation;

import java.lang.annotation.*;

/**
 * 接口限流注解
 * 基于 Redis Lua 令牌桶算法，支持 IP/用户/接口/自定义维度
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RateLimit {

    /**
     * 限流维度
     */
    LimitDimension dimension() default LimitDimension.IP;

    /**
     * 限流类型
     */
    LimitType type() default LimitType.TOKEN_BUCKET;

    /**
     * 每秒允许的请求数（QPS）
     */
    double permitsPerSecond() default 10;

    /**
     * 令牌桶最大容量（突发数）
     */
    int burstCapacity() default 20;

    /**
     * 滑动窗口时间（秒）— 仅 SLIDING_WINDOW 类型使用
     */
    int windowSeconds() default 1;

    /**
     * 限流 key 前缀
     */
    String keyPrefix() default "";

    /**
     * 自定义 key 的 SpEL 表达式（dimension=CUSTOM 时使用）
     * 例如 "#phone"、"#req.stationId"
     */
    String keyExpression() default "";

    /**
     * 超限时提示信息
     */
    String message() default "请求过于频繁，请稍后再试";

    /**
     * 限流维度枚举
     */
    enum LimitDimension {
        /** 按客户端 IP 限流 */
        IP,
        /** 按登录用户 ID 限流 */
        USER,
        /** 按接口 URI 限流 */
        API,
        /** 自定义 SpEL 表达式 */
        CUSTOM
    }

    /**
     * 限流算法类型
     */
    enum LimitType {
        /** 令牌桶（平滑限流，允许突发） */
        TOKEN_BUCKET,
        /** 滑动窗口（精确窗口内计数） */
        SLIDING_WINDOW
    }
}
