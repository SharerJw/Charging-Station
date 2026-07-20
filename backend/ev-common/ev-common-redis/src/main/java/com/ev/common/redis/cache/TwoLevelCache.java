package com.ev.common.redis.cache;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;

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
    private final ScheduledExecutorService scheduler;

    /** L1 缓存统计 */
    private final AtomicLong l1Hits = new AtomicLong(0);
    private final AtomicLong l1Misses = new AtomicLong(0);
    private final AtomicLong l2Hits = new AtomicLong(0);
    private final AtomicLong l2Misses = new AtomicLong(0);

    public TwoLevelCache(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
        this.caffeineCache = Caffeine.newBuilder()
                .maximumSize(10_000)
                .expireAfterWrite(5, TimeUnit.MINUTES)
                .recordStats()
                .build();
        ThreadFactory daemonFactory = r -> {
            Thread t = new Thread(r, "cache-double-delete");
            t.setDaemon(true);
            return t;
        };
        this.scheduler = Executors.newSingleThreadScheduledExecutor(daemonFactory);
    }

    /**
     * 应用关闭时停止调度器，防止线程泄漏
     */
    @PreDestroy
    public void shutdown() {
        scheduler.shutdown();
    }

    /**
     * 获取缓存（L1 → L2）
     */
    @SuppressWarnings("unchecked")
    public <T> T get(String key) {
        // L1 查找
        Object value = caffeineCache.getIfPresent(key);
        if (value != null) {
            l1Hits.incrementAndGet();
            return (T) value;
        }
        l1Misses.incrementAndGet();

        // L2 查找
        value = redisTemplate.opsForValue().get(key);
        if (value != null) {
            l2Hits.incrementAndGet();
            caffeineCache.put(key, value); // 回填L1
            return (T) value;
        }
        l2Misses.incrementAndGet();
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
        scheduler.schedule(() -> redisTemplate.delete(key), 500, TimeUnit.MILLISECONDS);
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
        long l1HitsVal = l1Hits.get();
        long l1MissesVal = l1Misses.get();
        long l2HitsVal = l2Hits.get();
        long l2MissesVal = l2Misses.get();
        long l1Total = l1HitsVal + l1MissesVal;
        long l2Total = l2HitsVal + l2MissesVal;
        return new CacheStats(
                l1HitsVal, l1MissesVal, l1Total > 0 ? (double) l1HitsVal / l1Total : 0,
                l2HitsVal, l2MissesVal, l2Total > 0 ? (double) l2HitsVal / l2Total : 0,
                caffeineCache.estimatedSize()
        );
    }

    public record CacheStats(
            long l1Hits, long l1Misses, double l1HitRate,
            long l2Hits, long l2Misses, double l2HitRate,
            long l1Size
    ) {}
}
