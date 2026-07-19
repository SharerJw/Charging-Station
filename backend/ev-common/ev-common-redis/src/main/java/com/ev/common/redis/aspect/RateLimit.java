package com.ev.common.redis.aspect;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * API 限流注解 - 配合 RateLimitAspect 使用
 * 基于 Redis Lua 脚本实现令牌桶算法
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RateLimit {

    /**
     * 每秒允许的请求数
     */
    double permitsPerSecond() default 10.0;

    /**
     * 令牌桶最大容量
     */
    int burstCapacity() default 20;

    /**
     * 限流 key 前缀
     */
    String key() default "";

    /**
     * 限流维度：IP, USER, GLOBAL
     */
    LimitType limitType() default LimitType.IP;

    /**
     * 限流维度枚举
     */
    enum LimitType {
        /**
         * 基于客户端 IP 限流
         */
        IP,
        /**
         * 基于用户 ID 限流
         */
        USER,
        /**
         * 全局限流
         */
        GLOBAL
    }
}