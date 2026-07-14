package com.ev.gateway.filter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.Arrays;
import java.util.List;

/**
 * 网关全局过滤器 - JWT 解析 + 用户上下文注入
 */
@Slf4j
@Component
public class AuthGlobalFilter implements GlobalFilter, Ordered {

    /** 白名单路径 */
    private static final List<String> WHITE_LIST = Arrays.asList(
            "/api/auth/login",
            "/api/v1/auth/login",
            "/api/v1/ops/auth/login",
            "/api/simulator/",
            "/actuator/",
            "/doc.html",
            "/v3/api-docs"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();

        // 白名单放行
        for (String white : WHITE_LIST) {
            if (path.startsWith(white)) {
                return chain.filter(exchange);
            }
        }

        // 提取 Authorization header
        String authHeader = request.getHeaders().getFirst("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            // L1 阶段暂时放行未认证请求，后续加严格校验
            log.debug("未携带token: {}", path);
            return chain.filter(exchange);
        }

        // 注入下游请求头（简化版，L1阶段直接透传token）
        ServerHttpRequest mutatedRequest = request.mutate()
                .header("X-Token", authHeader.substring(7))
                .build();

        return chain.filter(exchange.mutate().request(mutatedRequest).build());
    }

    @Override
    public int getOrder() {
        return -100;
    }
}
