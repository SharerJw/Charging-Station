package com.ev.common.redis.util;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

/**
 * 分布式锁（支持 owner 校验 + watchdog 自动续期）
 * <p>
 * 核心安全保证：
 * <ul>
 *   <li>加锁时生成 UUID owner，存入 Redis value</li>
 *   <li>解锁时通过 Lua 脚本原子校验 owner，防止误释放其他线程的锁</li>
 *   <li>ThreadLocal 自动追踪当前线程持有的锁，支持无参 unlock</li>
 *   <li>可选 watchdog 定时续期，防止业务未完成锁已过期</li>
 * </ul>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RedisLock {

    private final RedisTemplate<String, Object> redisTemplate;

    private static final String LOCK_PREFIX = "lock:";

    // ========================= Lua 脚本 =========================

    /**
     * Lua 脚本：原子性校验 owner 后再删除锁
     * ARGV[1] = owner 标识，KEYS[1] = 锁的 key
     */
    private static final DefaultRedisScript<Long> UNLOCK_SCRIPT = new DefaultRedisScript<>(
            "if redis.call('get', KEYS[1]) == ARGV[1] then " +
                    "  return redis.call('del', KEYS[1]) " +
                    "else " +
                    "  return 0 " +
                    "end",
            Long.class
    );

    /**
     * Lua 脚本：原子性校验 owner 后续期锁（毫秒级过期）
     * ARGV[1] = owner 标识，ARGV[2] = 过期毫秒数，KEYS[1] = 锁的 key
     */
    private static final DefaultRedisScript<Long> RENEW_SCRIPT = new DefaultRedisScript<>(
            "if redis.call('get', KEYS[1]) == ARGV[1] then " +
                    "  return redis.call('pexpire', KEYS[1], ARGV[2]) " +
                    "else " +
                    "  return 0 " +
                    "end",
            Long.class
    );

    // ========================= ThreadLocal owner 追踪 =========================

    /**
     * 每个线程持有的锁 owner 映射: lockKey(原始key，不含前缀) -> owner
     * <p>用于 {@link #unlock(String)} 在无外部 owner 时进行安全校验</p>
     */
    private static final ThreadLocal<Map<String, String>> LOCK_OWNER_MAP =
            ThreadLocal.withInitial(ConcurrentHashMap::new);

    // ========================= Watchdog 续期 =========================

    /** watchdog 调度线程池（守护线程，应用关闭时自动回收） */
    private static final ScheduledExecutorService WATCHDOG_EXECUTOR =
            Executors.newSingleThreadScheduledExecutor(r -> {
                Thread t = new Thread(r, "redis-lock-watchdog");
                t.setDaemon(true);
                return t;
            });

    /** 每个锁 key 对应的 watchdog future，用于取消续期 */
    private final ConcurrentHashMap<String, ScheduledFuture<?>> watchdogFutures = new ConcurrentHashMap<>();

    /** watchdog 续期间隔 = 锁 TTL * WATCHDOG_RENEW_RATIO（建议 1/3） */
    private static final double WATCHDOG_RENEW_RATIO = 1.0 / 3.0;

    // ========================= tryLock 系列 =========================

    /**
     * 尝试获取锁（向后兼容，owner 自动存入 ThreadLocal）
     *
     * @param key            锁的 key
     * @param timeoutSeconds 锁的过期时间（秒）
     * @return 是否成功获取锁
     */
    public boolean tryLock(String key, long timeoutSeconds) {
        return tryLockWithOwner(key, timeoutSeconds) != null;
    }

    /**
     * 尝试获取锁（默认 30 秒过期）
     */
    public boolean tryLock(String key) {
        return tryLock(key, 30);
    }

    /**
     * 尝试获取锁（外部指定 owner）
     * <p>适用于跨进程共享锁场景，调用方自行管理 owner 的生命周期</p>
     *
     * @param key            锁的 key
     * @param timeoutSeconds 锁的过期时间（秒）
     * @param owner          调用方指定的 owner 标识
     * @return 是否成功获取锁
     */
    public boolean tryLock(String key, long timeoutSeconds, String owner) {
        String lockKey = LOCK_PREFIX + key;
        Boolean result = redisTemplate.opsForValue()
                .setIfAbsent(lockKey, owner, timeoutSeconds, TimeUnit.SECONDS);
        if (Boolean.TRUE.equals(result)) {
            LOCK_OWNER_MAP.get().put(key, owner);
            return true;
        }
        return false;
    }

    /**
     * 尝试获取锁并返回 owner 标识
     * <p>owner 同时存入 ThreadLocal，供无参 {@link #unlock(String)} 使用</p>
     *
     * @param key            锁的 key
     * @param timeoutSeconds 锁的过期时间（秒）
     * @return owner 标识（UUID 字符串），获取失败返回 null
     */
    public String tryLockWithOwner(String key, long timeoutSeconds) {
        String lockKey = LOCK_PREFIX + key;
        String owner = UUID.randomUUID().toString();
        Boolean result = redisTemplate.opsForValue()
                .setIfAbsent(lockKey, owner, timeoutSeconds, TimeUnit.SECONDS);
        if (Boolean.TRUE.equals(result)) {
            LOCK_OWNER_MAP.get().put(key, owner);
            return owner;
        }
        return null;
    }

    /**
     * 尝试获取锁并返回 owner 标识（默认 30 秒过期）
     */
    public String tryLockWithOwner(String key) {
        return tryLockWithOwner(key, 30);
    }

    /**
     * 尝试获取带 watchdog 自动续期的锁
     * <p>锁在持有期间会自动续期，防止业务未完成锁已过期。
     * 释放锁时必须调用 {@link #unlockWithWatchdog(String)} 或 {@link #unlockWithWatchdog(String, String)}</p>
     *
     * @param key            锁的 key
     * @param timeoutSeconds 锁的过期时间（秒），也是每次续期的时长
     * @return owner 标识，获取失败返回 null
     */
    public String tryLockWithWatchdog(String key, long timeoutSeconds) {
        String owner = tryLockWithOwner(key, timeoutSeconds);
        if (owner == null) {
            return null;
        }
        startWatchdog(key, timeoutSeconds, owner);
        return owner;
    }

    /**
     * 尝试获取带 watchdog 的锁（默认 30 秒过期）
     */
    public String tryLockWithWatchdog(String key) {
        return tryLockWithWatchdog(key, 30);
    }

    // ========================= unlock 系列 =========================

    /**
     * 释放锁（带 owner 校验，原子操作）
     *
     * @param key   锁的 key
     * @param owner 获取锁时返回的 owner 标识
     * @return true 如果成功释放，false 如果不是当前锁的持有者
     */
    public boolean unlock(String key, String owner) {
        String lockKey = LOCK_PREFIX + key;
        try {
            Long result = redisTemplate.execute(UNLOCK_SCRIPT, Collections.singletonList(lockKey), owner);
            return result != null && result == 1L;
        } finally {
            cleanOwner(key);
        }
    }

    /**
     * 释放锁（从 ThreadLocal 自动获取 owner 进行安全校验）
     * <p>必须先通过 {@link #tryLock}、{@link #tryLockWithOwner} 或
     * {@link #tryLockWithWatchdog} 获取锁，owner 会自动存入 ThreadLocal。</p>
     * <p>如果 ThreadLocal 中找不到 owner（如跨线程调用），会记录警告日志后直接删除。
     * 为了安全起见，建议始终使用 {@link #unlock(String, String)}</p>
     */
    public void unlock(String key) {
        String owner = LOCK_OWNER_MAP.get().get(key);
        if (owner != null) {
            unlock(key, owner);
        } else {
            log.warn("unlock(key={}) 未在 ThreadLocal 中找到 owner，" +
                    "无法进行安全校验，将直接删除锁（不推荐，建议使用 unlock(key, owner)）", key);
            String lockKey = LOCK_PREFIX + key;
            redisTemplate.delete(lockKey);
            cleanOwner(key);
        }
    }

    /**
     * 释放带 watchdog 的锁（停止续期 + owner 校验释放）
     *
     * @param key 锁的 key
     */
    public void unlockWithWatchdog(String key) {
        cancelWatchdog(key);
        unlock(key);
    }

    /**
     * 释放带 watchdog 的锁（指定 owner，停止续期 + 原子释放）
     *
     * @param key   锁的 key
     * @param owner 获取锁时返回的 owner 标识
     * @return true 如果成功释放
     */
    public boolean unlockWithWatchdog(String key, String owner) {
        cancelWatchdog(key);
        return unlock(key, owner);
    }

    // ========================= Watchdog 内部实现 =========================

    /**
     * 启动 watchdog 定时续期任务
     * <p>续期间隔 = timeoutSeconds / 3，每次续期重新设置完整的 TTL</p>
     */
    private void startWatchdog(String key, long timeoutSeconds, String owner) {
        long renewIntervalMs = (long) (timeoutSeconds * 1000 * WATCHDOG_RENEW_RATIO);

        ScheduledFuture<?> future = WATCHDOG_EXECUTOR.scheduleWithFixedDelay(() -> {
            try {
                String lockKey = LOCK_PREFIX + key;
                Long result = redisTemplate.execute(
                        RENEW_SCRIPT,
                        Collections.singletonList(lockKey),
                        owner,
                        String.valueOf(timeoutSeconds * 1000)
                );
                if (result == null || result == 0L) {
                    // 锁已被其他线程持有或已过期，停止 watchdog
                    log.debug("watchdog: 锁 key={} 已不被 owner={} 持有，停止续期", key, owner);
                    cancelWatchdog(key);
                }
            } catch (Exception e) {
                log.error("watchdog 续期异常: key={}, owner={}", key, owner, e);
                cancelWatchdog(key);
            }
        }, renewIntervalMs, renewIntervalMs, TimeUnit.MILLISECONDS);

        watchdogFutures.put(key, future);
    }

    /**
     * 取消指定锁的 watchdog 续期任务
     */
    private void cancelWatchdog(String key) {
        ScheduledFuture<?> future = watchdogFutures.remove(key);
        if (future != null) {
            future.cancel(false);
        }
    }

    /**
     * 清理 ThreadLocal 中的 owner 记录
     */
    private void cleanOwner(String key) {
        Map<String, String> ownerMap = LOCK_OWNER_MAP.get();
        ownerMap.remove(key);
        if (ownerMap.isEmpty()) {
            LOCK_OWNER_MAP.remove();
        }
    }

    // ========================= 缓存工具方法 =========================

    /**
     * 设置缓存
     */
    public void set(String key, Object value, long timeout, TimeUnit unit) {
        redisTemplate.opsForValue().set(key, value, timeout, unit);
    }

    /**
     * 获取缓存
     */
    @SuppressWarnings("unchecked")
    public <T> T get(String key) {
        return (T) redisTemplate.opsForValue().get(key);
    }

    /**
     * 删除缓存
     */
    public Boolean delete(String key) {
        return redisTemplate.delete(key);
    }

    /**
     * 判断 key 是否存在
     */
    public Boolean hasKey(String key) {
        return redisTemplate.hasKey(key);
    }

    /**
     * 设置过期时间
     */
    public Boolean expire(String key, long timeout, TimeUnit unit) {
        return redisTemplate.expire(key, timeout, unit);
    }
}
