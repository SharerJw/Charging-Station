package com.ev.gateway.filter;

import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

/**
 * 全局安全响应头过滤器
 *
 * 为所有响应注入以下安全头：
 * - X-Content-Type-Options: nosniff  防止 MIME 嗅探
 * - X-Frame-Options: DENY            禁止 iframe 嵌入
 * - X-XSS-Protection: 0              禁用浏览器内置 XSS 过滤（依赖 CSP）
 * - Cache-Control: no-store           禁止缓存敏感内容
 * - Content-Security-Policy: default-src 'self'  基本 CSP 策略
 * - Referrer-Policy: strict-origin-when-cross-origin
 */
@Component
public class SecurityHeadersFilter implements WebFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        exchange.getResponse().getHeaders().set("X-Content-Type-Options", "nosniff");
        exchange.getResponse().getHeaders().set("X-Frame-Options", "DENY");
        exchange.getResponse().getHeaders().set("X-XSS-Protection", "0");
        exchange.getResponse().getHeaders().set("Cache-Control", "no-store");
        exchange.getResponse().getHeaders().set("Content-Security-Policy", "default-src 'self'");
        exchange.getResponse().getHeaders().set("Referrer-Policy", "strict-origin-when-cross-origin");
        return chain.filter(exchange);
    }

    @Override
    public int getOrder() {
        // 高优先级，确保所有响应（包括错误页面）都携带安全头
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
