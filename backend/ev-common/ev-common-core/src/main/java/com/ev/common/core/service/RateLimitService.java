package com.ev.common.core.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

/**
 * 限流服务
 * 提供令牌桶和滑动窗口两种限流算法，基于 Redis Lua 脚本保证原子性
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RateLimitService {

    private final StringRedisTemplate redisTemplate;

    /**
     * 令牌桶 Lua 脚本
     * KEYS[1] = 限流 key
     * ARGV[1] = 当前时间戳（秒）
     * ARGV[2] = 每秒填充速率
     * ARGV[3] = 桶容量
     * 返回 {1, 剩余令牌数} 或 {0, 0}
     */
    private static final String TOKEN_BUCKET_LUA = """
            local key = KEYS[1]
            local now = tonumber(ARGV[1])
            local rate = tonumber(ARGV[2])
            local capacity = tonumber(ARGV[3])

            local last_time = tonumber(redis.call('hget', key, 'lt') or now)
            local tokens = tonumber(redis.call('hget', key, 'tk') or capacity)

            local elapsed = math.max(0, now - last_time)
            tokens = math.min(capacity, tokens + elapsed * rate)

            if tokens >= 1 then
                tokens = tokens - 1
                redis.call('hset', key, 'tk', tokens)
                redis.call('hset', key, 'lt', now)
                redis.call('expire', key, math.ceil(capacity / rate) + 1)
                return {1, math.floor(tokens)}
            else
                redis.call('hset', key, 'lt', now)
                redis.call('expire', key, math.ceil(capacity / rate) + 1)
                return {0, 0}
            end
            """;

    /**
     * 滑动窗口 Lua 脚本
     * KEYS[1] = 限流 key
     * ARGV[1] = 窗口起始时间戳（毫秒）
     * ARGV[2] = 当前时间戳（毫秒）
     * ARGV[3] = 最大请求数
     * ARGV[4] = 窗口大小（毫秒）
     * 返回 {1, 当前窗口计数} 或 {0, 当前窗口计数}
     */
    private static final String SLIDING_WINDOW_LUA = """
            local key = KEYS[1]
            local window_start = tonumber(ARGV[1])
            local now = tonumber(ARGV[2])
            local max_requests = tonumber(ARGV[3])
            local window_ms = tonumber(ARGV[4])

            redis.call('zremrangebyscore', key, 0, window_start)
            local count = redis.call('zcard', key)

            if count < max_requests then
                redis.call('zadd', key, now, now .. '-' .. math.random(100000))
                redis.call('pexpire', key, window_ms)
                return {1, count + 1}
            else
                return {0, count}
            end
            """;

    /**
     * 令牌桶限流
     *
     * @param key      限流 key
     * @param rate     每秒填充速率
     * @param capacity 桶最大容量
     * @return true=允许通过, false=被限流
     */
    public boolean tryAcquireTokenBucket(String key, double rate, int capacity) {
        long now = System.currentTimeMillis() / 1000;

        List<Long> result = redisTemplate.execute(
                new DefaultRedisScript<>(TOKEN_BUCKET_LUA, List.class),
                Collections.singletonList(key),
                String.valueOf(now),
                String.valueOf(rate),
                String.valueOf(capacity)
        );

        if (result != null && !result.isEmpty() && result.get(0) == 1) {
            log.debug("令牌桶限流通过: key={}, remaining={}", key, result.get(1));
            return true;
        }

        log.warn("令牌桶限流拒绝: key={}", key);
        return false;
    }

    /**
     * 滑动窗口限流
     *
     * @param key          限流 key
     * @param maxRequests  窗口内最大请求数
     * @param windowSeconds 窗口大小（秒）
     * @return true=允许通过, false=被限流
     */
    public boolean tryAcquireSlidingWindow(String key, int maxRequests, int windowSeconds) {
        long now = System.currentTimeMillis();
        long windowStart = now - windowSeconds * 1000L;

        List<Long> result = redisTemplate.execute(
                new DefaultRedisScript<>(SLIDING_WINDOW_LUA, List.class),
                Collections.singletonList(key),
                String.valueOf(windowStart),
                String.valueOf(now),
                String.valueOf(maxRequests),
                String.valueOf(windowSeconds * 1000L)
        );

        if (result != null && !result.isEmpty() && result.get(0) == 1) {
            log.debug("滑动窗口限流通过: key={}, count={}", key, result.get(1));
            return true;
        }

        log.warn("滑动窗口限流拒绝: key={}", key);
        return false;
    }
}
