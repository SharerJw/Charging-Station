package com.ev.gateway.filter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;

/**
 * 请求审计日志过滤器
 * <p>
 * 记录每个请求的方法、URI、客户端IP、耗时和响应状态码。
 * 白名单路径不记录。
 * </p>
 */
@Slf4j
@Component
public class AuditLogFilter implements GlobalFilter, Ordered {

    private static final int ORDER = -80;

    private static final List<String> AUDIT_WHITELIST = List.of(
            "/actuator/",
            "/doc.html",
            "/v3/api-docs"
    );

    @Override
    public int getOrder() {
        return ORDER;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        long startTime = System.currentTimeMillis();
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();

        // 白名单路径跳过审计
        for (String prefix : AUDIT_WHITELIST) {
            if (path.startsWith(prefix)) {
                return chain.filter(exchange);
            }
        }

        String method = request.getMethod() != null ? request.getMethod().name() : "UNKNOWN";
        String clientIp = resolveClientIp(request);

        return chain.filter(exchange).then(Mono.fromRunnable(() -> {
            try {
                ServerHttpResponse response = exchange.getResponse();
                int statusCode = response.getStatusCode() != null
                        ? response.getStatusCode().value()
                        : 0;
                long durationMs = System.currentTimeMillis() - startTime;
                log.info("[AUDIT] {} {} {} {}ms {}", method, path, clientIp, durationMs, statusCode);
            } catch (Exception e) {
                // 审计日志记录失败不应影响请求处理
                log.debug("[AUDIT] failed to write audit log: {}", e.getMessage());
            }
        }));
    }

    /**
     * 从 X-Forwarded-For 或 RemoteAddress 获取客户端真实IP
     */
    private String resolveClientIp(ServerHttpRequest request) {
        List<String> forwardedFor = request.getHeaders().get(HttpHeaders.X_FORWARDED_FOR);
        if (forwardedFor != null && !forwardedFor.isEmpty()) {
            String firstIp = forwardedFor.get(0);
            if (firstIp != null && !firstIp.isBlank()) {
                // X-Forwarded-For 可能包含多个IP，取第一个（最原始客户端）
                return firstIp.contains(",") ? firstIp.split(",")[0].trim() : firstIp.trim();
            }
        }
        if (request.getRemoteAddress() != null) {
            return request.getRemoteAddress().getAddress().getHostAddress();
        }
        return "unknown";
    }
}
