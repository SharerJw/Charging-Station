package com.ev.common.redis.cache;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

/**
 * 两级缓存：L1 Caffeine + L2 Redis
 * 读：L1 → L2 → DB
 * 写：删除L1 → 写DB → 延迟删除L2
 */
@Slf4j
@Component
public class TwoLevelCache {

    private final Cache<String, Object> caffeineCache;
    private final RedisTemplate<String, Object> redisTemplate;

    /** L1 缓存统计 */
    private long l1Hits = 0;
    private long l1Misses = 0;
    private long l2Hits = 0;
    private long l2Misses = 0;

    public TwoLevelCache(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
        this.caffeineCache = Caffeine.newBuilder()
                .maximumSize(10_000)
                .expireAfterWrite(5, TimeUnit.MINUTES)
                .recordStats()
                .build();
    }

    /**
     * 获取缓存（L1 → L2）
     */
    @SuppressWarnings("unchecked")
    public <T> T get(String key) {
        // L1 查找
        Object value = caffeineCache.getIfPresent(key);
        if (value != null) {
            l1Hits++;
            return (T) value;
        }
        l1Misses++;

        // L2 查找
        value = redisTemplate.opsForValue().get(key);
        if (value != null) {
            l2Hits++;
            caffeineCache.put(key, value); // 回填L1
            return (T) value;
        }
        l2Misses++;
        return null;
    }

    /**
     * 设置缓存（同时写L1和L2）
     */
    public void put(String key, Object value, long ttlSeconds) {
        caffeineCache.put(key, value);
        redisTemplate.opsForValue().set(key, value, ttlSeconds, TimeUnit.SECONDS);
    }

    /**
     * 设置缓存（默认1小时TTL）
     */
    public void put(String key, Object value) {
        put(key, value, 3600);
    }

    /**
     * 删除缓存（Cache-Aside + 延迟双删）
     */
    public void evict(String key) {
        caffeineCache.invalidate(key);
        redisTemplate.delete(key);
        // 延迟双删：500ms后再次删除Redis（防止并发读写导致脏数据）
        new Thread(() -> {
            try {
                Thread.sleep(500);
                redisTemplate.delete(key);
            } catch (InterruptedException ignored) {
                Thread.currentThread().interrupt();
            }
        }).start();
    }

    /**
     * 清除所有缓存
     */
    public void evictAll() {
        caffeineCache.invalidateAll();
        // 不清除所有Redis，只清除L1
    }

    /**
     * 获取缓存命中率统计
     */
    public CacheStats getStats() {
        long l1Total = l1Hits + l1Misses;
        long l2Total = l2Hits + l2Misses;
        return new CacheStats(
                l1Hits, l1Misses, l1Total > 0 ? (double) l1Hits / l1Total : 0,
                l2Hits, l2Misses, l2Total > 0 ? (double) l2Hits / l2Total : 0,
                caffeineCache.estimatedSize()
        );
    }

    public record CacheStats(
            long l1Hits, long l1Misses, double l1HitRate,
            long l2Hits, long l2Misses, double l2HitRate,
            long l1Size
    ) {}
}
