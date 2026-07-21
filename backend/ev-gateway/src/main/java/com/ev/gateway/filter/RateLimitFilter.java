package com.ev.gateway.filter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferFactory;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;

/**
 * 网关全局过滤器 - 基于 Redis Lua 令牌桶算法的限流过滤器
 * <p>
 * 令牌桶算法原理：
 * - 桶以固定速率填充令牌（本例每秒20个）
 * - 桶容量为40（允许突发流量）
 * - 每个请求消耗一个令牌
 * - 无令牌时拒绝请求
 * <p>
 * Lua 脚本保证令牌操作的原子性，避免并发场景下的竞态条件。
 */
@Slf4j
@Component
public class RateLimitFilter implements GlobalFilter, Ordered {

    /** 限流 Redis Key 前缀 */
    private static final String RATE_LIMIT_KEY_PREFIX = "rate:limit:";

    /** 桶容量（最大令牌数） */
    private static final long CAPACITY = 40;

    /** 每秒允许的请求数（令牌填充速率） */
    private static final long LIMIT_PER_SECOND = 20;

    /** 白名单路径 - 不参与限流 */
    private static final List<String> WHITE_LIST = Arrays.asList(
            "/actuator/",
            "/doc.html",
            "/v3/api-docs",
            "/api/simulator/",
            "/api/auth/"
    );

    /**
     * Redis Lua 脚本 - 令牌桶限流
     * <p>
     * 参数说明：
     * KEYS[1] - 限流的 key（如 rate:limit:192.168.1.1）
     * ARGV[1] - 桶容量 (capacity)
     * ARGV[2] - 每秒填充的令牌数 (limit)
     * ARGV[3] - 当前时间戳（秒）
     * <p>
     * 返回值：1=允许请求，0=拒绝请求
     */
    private static final String LUA_SCRIPT = """
            -- 令牌桶限流 Lua 脚本
            -- KEYS[1]: 限流 key
            -- ARGV[1]: 桶容量
            -- ARGV[2]: 每秒填充令牌数
            -- ARGV[3]: 当前时间戳（秒）

            local key = KEYS[1]
            local capacity = tonumber(ARGV[1])
            local refill_rate = tonumber(ARGV[2])
            local now = tonumber(ARGV[3])

            -- 获取当前桶状态：[token_count, last_refill_time]
            local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
            local tokens = tonumber(bucket[1])
            local last_refill = tonumber(bucket[2])

            -- 首次请求，初始化桶为满
            if tokens == nil then
                tokens = capacity
                last_refill = now
            end

            -- 计算需要补充的令牌数
            local elapsed = now - last_refill
            if elapsed > 0 then
                local refill_tokens = elapsed * refill_rate
                tokens = math.min(capacity, tokens + refill_tokens)
                last_refill = now
            end

            -- 尝试消耗一个令牌
            if tokens >= 1 then
                tokens = tokens - 1
                -- 更新桶状态，设置过期时间2秒后清理（防止内存泄漏）
                redis.call('HMSET', key, 'tokens', tokens, 'last_refill', last_refill)
                redis.call('EXPIRE', key, 2)
                return 1
            else
                -- 令牌不足，更新最后填充时间但不消耗令牌
                redis.call('HMSET', key, 'tokens', tokens, 'last_refill', last_refill)
                redis.call('EXPIRE', key, 2)
                return 0
            end
            """;

    private final ReactiveStringRedisTemplate redisTemplate;
    private final RedisScript<Long> redisScript;

    public RateLimitFilter(ReactiveStringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
        this.redisScript = RedisScript.of(LUA_SCRIPT, Long.class);
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();

        // 白名单路径放行
        for (String white : WHITE_LIST) {
            if (path.startsWith(white)) {
                return chain.filter(exchange);
            }
        }

        // 提取客户端 IP 作为限流 key
        String clientIp = extractClientIp(request);
        String redisKey = RATE_LIMIT_KEY_PREFIX + clientIp;

        // 获取当前时间戳（秒）
        long nowSeconds = System.currentTimeMillis() / 1000;

        // 执行 Lua 脚本进行令牌桶限流
        return redisTemplate.execute(
                redisScript,
                List.of(redisKey),
                List.of(
                        String.valueOf(CAPACITY),
                        String.valueOf(LIMIT_PER_SECOND),
                        String.valueOf(nowSeconds)
                )
        )
        .next() // Mono<Long> -> 取第一个结果
        .flatMap(allowed -> {
            if (allowed == 1L) {
                // 令牌充足，放行请求
                return chain.filter(exchange);
            } else {
                // 令牌不足，返回 429 Too Many Requests
                log.warn("请求限流: IP={}, Path={}", clientIp, path);
                ServerHttpResponse response = exchange.getResponse();
                response.setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
                response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
                DataBufferFactory bufferFactory = response.bufferFactory();
                byte[] bytes = "{\"code\":429,\"message\":\"请求过于频繁，请稍后再试\",\"data\":null}"
                        .getBytes(StandardCharsets.UTF_8);
                DataBuffer dataBuffer = bufferFactory.wrap(bytes);
                return response.writeWith(Mono.just(dataBuffer));
            }
        });
    }

    /**
     * 从请求中提取客户端真实 IP
     * <p>
     * 优先级：
     * 1. X-Forwarded-For（反向代理场景）
     * 2. X-Real-IP（Nginx 反向代理）
     * 3. 远程地址（直连场景）
     */
    private String extractClientIp(ServerHttpRequest request) {
        // 尝试从 X-Forwarded-For 获取（取第一个，即原始客户端 IP）
        String xff = request.getHeaders().getFirst("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            // X-Forwarded-For 格式：client, proxy1, proxy2
            String firstIp = xff.split(",")[0].trim();
            if (!firstIp.isBlank()) {
                return firstIp;
            }
        }

        // 尝试从 X-Real-IP 获取
        String xRealIp = request.getHeaders().getFirst("X-Real-IP");
        if (xRealIp != null && !xRealIp.isBlank()) {
            return xRealIp.trim();
        }

        // 使用远程地址
        InetSocketAddress remoteAddress = request.getRemoteAddress();
        if (remoteAddress != null) {
            InetAddress address = remoteAddress.getAddress();
            if (address != null) {
                return address.getHostAddress();
            }
        }

        // 兜底返回 unknown
        return "unknown";
    }

    @Override
    public int getOrder() {
        // 在 AuthGlobalFilter (-100) 之后执行，先认证再限流
        return -90;
    }
}
