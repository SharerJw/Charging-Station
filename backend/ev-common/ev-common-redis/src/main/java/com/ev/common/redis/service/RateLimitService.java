package com.ev.common.redis.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.util.Collections;

/**
 * 限流服务 - 基于 Redis Lua 脚本实现令牌桶算法
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RateLimitService {

    private final RedisTemplate<String, Object> redisTemplate;

    /**
     * 令牌桶 Lua 脚本
     * KEYS[1] - 限流 key
     * ARGV[1] - 当前时间戳（秒）
     * ARGV[2] - 令牌生成速率（每秒）
     * ARGV[3] - 令牌桶最大容量
     */
    private static final String TOKEN_BUCKET_SCRIPT = """
            local key = KEYS[1]
            local now = tonumber(ARGV[1])
            local rate = tonumber(ARGV[2])
            local capacity = tonumber(ARGV[3])

            local last_time = tonumber(redis.call('hget', key, 'last_time') or now)
            local tokens = tonumber(redis.call('hget', key, 'tokens') or capacity)

            local elapsed = now - last_time
            local new_tokens = elapsed * rate
            tokens = math.min(capacity, tokens + new_tokens)

            if tokens >= 1 then
                tokens = tokens - 1
                redis.call('hset', key, 'tokens', tokens)
                redis.call('hset', key, 'last_time', now)
                redis.call('expire', key, math.ceil(capacity / rate) + 1)
                return {1, tokens}
            else
                return {0, tokens}
            end
            """;

    /**
     * 尝试获取令牌
     *
     * @param key             限流 key
     * @param permitsPerSecond 每秒允许的请求数
     * @param burstCapacity    令牌桶最大容量
     * @return true 表示获取成功，false 表示被限流
     */
    public boolean tryAcquire(String key, double permitsPerSecond, int burstCapacity) {
        try {
            DefaultRedisScript<Long[]> script = new DefaultRedisScript<>(TOKEN_BUCKET_SCRIPT, Long[].class);

            long nowSeconds = System.currentTimeMillis() / 1000;

            Long[] result = redisTemplate.execute(
                    script,
                    Collections.singletonList(key),
                    String.valueOf(nowSeconds),
                    String.valueOf(permitsPerSecond),
                    String.valueOf(burstCapacity)
            );

            if (result != null && result.length == 2) {
                boolean allowed = result[0] == 1;
                double remainingTokens = result[1];

                if (!allowed) {
                    log.warn("限流触发 - key: {}, 剩余令牌: {}", key, remainingTokens);
                }

                return allowed;
            }

            return false;
        } catch (Exception e) {
            log.error("限流服务异常 - key: {}", key, e);
            // 异常时放行，避免限流服务故障导致整体不可用
            return true;
        }
    }

    /**
     * 尝试获取令牌（使用默认配置）
     *
     * @param key 限流 key
     * @return true 表示获取成功，false 表示被限流
     */
    public boolean tryAcquire(String key) {
        return tryAcquire(key, 10.0, 20);
    }

    /**
     * 生成限流 key
     *
     * @param prefix     key 前缀
     * @param limitType  限流维度
     * @param identifier 标识符（IP 或 userId）
     * @return 完整的限流 key
     */
    public String generateKey(String prefix, String limitType, String identifier) {
        StringBuilder keyBuilder = new StringBuilder("rate_limit:");

        if (prefix != null && !prefix.isEmpty()) {
            keyBuilder.append(prefix).append(":");
        }

        keyBuilder.append(limitType).append(":").append(identifier);

        return keyBuilder.toString();
    }
}