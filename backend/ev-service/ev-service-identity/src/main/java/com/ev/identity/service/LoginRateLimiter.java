package com.ev.identity.service;

import com.ev.common.core.exception.BizException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Collections;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Login rate limiter using Redis with in-memory fallback.
 *
 * Strategy:
 * - Track failed login attempts per username and per IP
 * - After 5 failed attempts, lock the account for 15 minutes
 * - On successful login, reset all failure counters
 */
@Slf4j
@Service
public class LoginRateLimiter {

    private static final int MAX_FAIL_ATTEMPTS = 5;
    private static final long LOCK_DURATION_MINUTES = 15;

    private static final String FAIL_KEY_PREFIX = "login:fail:";
    private static final String IP_FAIL_KEY_PREFIX = "login:fail:ip:";
    private static final String LOCK_KEY_PREFIX = "login:lock:";
    private static final String IP_LOCK_KEY_PREFIX = "login:lock:ip:";

    /**
     * Lua script: increment fail counter; if count >= MAX, set lock key with TTL.
     * KEYS[1] = fail counter key, KEYS[2] = lock key
     * ARGV[1] = max attempts, ARGV[2] = lock TTL in seconds
     * Returns the current fail count after increment.
     */
    private static final String INCREMENT_SCRIPT = """
            local count = redis.call('INCR', KEYS[1])
            if count == 1 then
                redis.call('EXPIRE', KEYS[1], ARGV[2])
            end
            if count >= tonumber(ARGV[1]) then
                redis.call('SET', KEYS[2], '1', 'EX', ARGV[2])
            end
            return count
            """;

    /**
     * Lua script: reset fail counter and remove lock key.
     * KEYS[1] = fail counter key, KEYS[2] = lock key, KEYS[3] = ip fail key, KEYS[4] = ip lock key
     */
    private static final String RESET_SCRIPT = """
            redis.call('DEL', KEYS[1])
            redis.call('DEL', KEYS[2])
            redis.call('DEL', KEYS[3])
            redis.call('DEL', KEYS[4])
            return 1
            """;

    private final StringRedisTemplate redisTemplate;
    private final boolean redisAvailable;

    // In-memory fallback state (used when Redis is unavailable)
    private final ConcurrentHashMap<String, FailRecord> inMemoryFailures = new ConcurrentHashMap<>();

    public LoginRateLimiter(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
        this.redisAvailable = checkRedisConnection();
        if (!redisAvailable) {
            log.warn("Redis unavailable, falling back to in-memory login rate limiting");
        }
    }

    /**
     * Check whether the given username or IP is currently locked out.
     *
     * @param username the login username
     * @param clientIp the client IP address
     * @throws BizException if either username or IP is locked
     */
    public void checkRateLimit(String username, String clientIp) {
        if (redisAvailable) {
            checkRateLimitRedis(username, clientIp);
        } else {
            checkRateLimitInMemory(username, clientIp);
        }
    }

    /**
     * Record a failed login attempt for both username and IP.
     *
     * @param username the login username
     * @param clientIp the client IP address
     */
    public void recordFailure(String username, String clientIp) {
        if (redisAvailable) {
            recordFailureRedis(username, clientIp);
        } else {
            recordFailureInMemory(username, clientIp);
        }
    }

    /**
     * Reset all failure counters on successful login.
     *
     * @param username the login username
     * @param clientIp the client IP address
     */
    public void resetCounters(String username, String clientIp) {
        if (redisAvailable) {
            resetCountersRedis(username, clientIp);
        } else {
            resetCountersInMemory(username, clientIp);
        }
    }

    // ==================== Redis implementation ====================

    private void checkRateLimitRedis(String username, String clientIp) {
        String usernameLockKey = LOCK_KEY_PREFIX + username;
        String ipLockKey = IP_LOCK_KEY_PREFIX + clientIp;

        if (Boolean.TRUE.equals(redisTemplate.hasKey(usernameLockKey))) {
            log.warn("Account locked due to too many failed attempts: username={}", username);
            throw BizException.loginTooManyAttempts();
        }
        if (Boolean.TRUE.equals(redisTemplate.hasKey(ipLockKey))) {
            log.warn("IP locked due to too many failed attempts: ip={}", clientIp);
            throw BizException.loginTooManyAttempts();
        }
    }

    private void recordFailureRedis(String username, String clientIp) {
        long lockTtlSeconds = LOCK_DURATION_MINUTES * 60;

        DefaultRedisScript<Long> script = new DefaultRedisScript<>(INCREMENT_SCRIPT, Long.class);

        // Increment username failure counter (KEYS[1]=failKey, KEYS[2]=lockKey)
        Long usernameCount = redisTemplate.execute(script,
                Arrays.asList(FAIL_KEY_PREFIX + username, LOCK_KEY_PREFIX + username),
                String.valueOf(MAX_FAIL_ATTEMPTS),
                String.valueOf(lockTtlSeconds));
        log.debug("Login failure recorded: username={}, count={}", username, usernameCount);

        // Increment IP failure counter (KEYS[1]=failKey, KEYS[2]=lockKey)
        Long ipCount = redisTemplate.execute(script,
                Arrays.asList(IP_FAIL_KEY_PREFIX + clientIp, IP_LOCK_KEY_PREFIX + clientIp),
                String.valueOf(MAX_FAIL_ATTEMPTS),
                String.valueOf(lockTtlSeconds));
        log.debug("Login failure recorded: ip={}, count={}", clientIp, ipCount);
    }

    private void resetCountersRedis(String username, String clientIp) {
        DefaultRedisScript<Long> script = new DefaultRedisScript<>(RESET_SCRIPT, Long.class);
        redisTemplate.execute(script,
                Arrays.asList(
                        FAIL_KEY_PREFIX + username,
                        LOCK_KEY_PREFIX + username,
                        IP_FAIL_KEY_PREFIX + clientIp,
                        IP_LOCK_KEY_PREFIX + clientIp));
        log.debug("Reset login failure counters: username={}, ip={}", username, clientIp);
    }

    // ==================== In-memory fallback implementation ====================

    private void checkRateLimitInMemory(String username, String clientIp) {
        String usernameLockKey = LOCK_KEY_PREFIX + username;
        String ipLockKey = IP_LOCK_KEY_PREFIX + clientIp;

        FailRecord usernameRecord = inMemoryFailures.get(usernameLockKey);
        if (usernameRecord != null && usernameRecord.isLocked()) {
            log.warn("Account locked (in-memory) due to too many failed attempts: username={}", username);
            throw BizException.loginTooManyAttempts();
        }

        FailRecord ipRecord = inMemoryFailures.get(ipLockKey);
        if (ipRecord != null && ipRecord.isLocked()) {
            log.warn("IP locked (in-memory) due to too many failed attempts: ip={}", clientIp);
            throw BizException.loginTooManyAttempts();
        }
    }

    private void recordFailureInMemory(String username, String clientIp) {
        String usernameFailKey = FAIL_KEY_PREFIX + username;
        String usernameLockKey = LOCK_KEY_PREFIX + username;
        String ipFailKey = IP_FAIL_KEY_PREFIX + clientIp;
        String ipLockKey = IP_LOCK_KEY_PREFIX + clientIp;

        int usernameCount = incrementFailCount(usernameFailKey, usernameLockKey);
        log.debug("Login failure recorded (in-memory): username={}, count={}", username, usernameCount);

        int ipCount = incrementFailCount(ipFailKey, ipLockKey);
        log.debug("Login failure recorded (in-memory): ip={}, count={}", clientIp, ipCount);
    }

    private void resetCountersInMemory(String username, String clientIp) {
        inMemoryFailures.remove(FAIL_KEY_PREFIX + username);
        inMemoryFailures.remove(LOCK_KEY_PREFIX + username);
        inMemoryFailures.remove(IP_FAIL_KEY_PREFIX + clientIp);
        inMemoryFailures.remove(IP_LOCK_KEY_PREFIX + clientIp);
        log.debug("Reset login failure counters (in-memory): username={}, ip={}", username, clientIp);
    }

    /**
     * Increment the fail counter for the given key. When the count reaches MAX_FAIL_ATTEMPTS,
     * a lock record is written instead.
     *
     * @return the current fail count (before locking)
     */
    private int incrementFailCount(String failKey, String lockKey) {
        FailRecord record = inMemoryFailures.compute(failKey, (key, existing) -> {
            if (existing == null || existing.isExpired()) {
                return new FailRecord(1, System.currentTimeMillis());
            }
            existing.increment();
            return existing;
        });

        int count = record.getCount();
        if (count >= MAX_FAIL_ATTEMPTS) {
            inMemoryFailures.computeIfAbsent(lockKey,
                    key -> new FailRecord(MAX_FAIL_ATTEMPTS, System.currentTimeMillis()));
        }
        return count;
    }

    // ==================== Utility ====================

    private boolean checkRedisConnection() {
        try {
            redisTemplate.hasKey("ping:login-rate-limiter");
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Internal record for in-memory failure tracking.
     * Each record holds a count and the timestamp of the first failure in the window.
     */
    private static class FailRecord {
        private final AtomicInteger count;
        private final long createdAt;

        FailRecord(int count, long createdAt) {
            this.count = new AtomicInteger(count);
            this.createdAt = createdAt;
        }

        void increment() {
            count.incrementAndGet();
        }

        int getCount() {
            return count.get();
        }

        boolean isExpired() {
            return System.currentTimeMillis() - createdAt > TimeUnit.MINUTES.toMillis(LOCK_DURATION_MINUTES);
        }

        boolean isLocked() {
            return !isExpired() && count.get() >= MAX_FAIL_ATTEMPTS;
        }
    }
}
