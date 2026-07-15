package com.ev.gateway.filter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

/**
 * 路径穿越防护过滤器
 *
 * 检测并拦截包含路径穿越模式的请求（如 /../），返回通用 404 响应，
 * 不向客户端暴露任何内部路径信息。
 *
 * 此过滤器优先级高于路由匹配，确保恶意请求在到达下游服务之前被拦截。
 */
@Slf4j
@Component
public class PathTraversalFilter implements WebFilter, Ordered {

    /** 路径穿越特征模式 */
    private static final String DOT_DOT_SLASH = "../";
    private static final String DOT_DOT_BACKSLASH = "..\\";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String rawPath = request.getURI().getRawPath();

        if (containsPathTraversal(rawPath)) {
            log.warn("[PathTraversal] Blocked suspicious path from {}: {}",
                    request.getRemoteAddress(), rawPath);
            // 直接返回 404，不暴露内部路径解析结果
            exchange.getResponse().setStatusCode(HttpStatus.NOT_FOUND);
            return exchange.getResponse().setComplete();
        }

        return chain.filter(exchange);
    }

    /**
     * 检查原始路径是否包含路径穿越模式
     * 使用原始 URI 路径（未解码），防止 %2e%2e%2f 等编码绕过
     */
    private boolean containsPathTraversal(String rawPath) {
        if (rawPath == null || rawPath.isEmpty()) {
            return false;
        }
        // 检查原始路径
        if (rawPath.contains(DOT_DOT_SLASH) || rawPath.contains(DOT_DOT_BACKSLASH)) {
            return true;
        }
        // 检查 URL 编码变体：%2e = .  %2f = /  %5c = \
        String lower = rawPath.toLowerCase();
        if (lower.contains("%2e%2e%2f") || lower.contains("%2e%2e%5c")) {
            return true;
        }
        // 混合编码：%2e. / .%2e
        if (lower.contains("%2e.") || lower.contains(".%2e")) {
            return true;
        }
        return false;
    }

    @Override
    public int getOrder() {
        // 在路由匹配之前执行（比 AuthGlobalFilter 更早）
        return Ordered.HIGHEST_PRECEDENCE + 1;
    }
}
