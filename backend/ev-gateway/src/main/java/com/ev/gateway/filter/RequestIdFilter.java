package com.ev.gateway.filter;

import org.slf4j.MDC;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * 请求追踪ID过滤器
 * <p>
 * 为每个请求注入 X-Request-Id，支持全链路追踪。
 * 优先级 -110（最高优先级），在所有 Filter 之前执行。
 * </p>
 */
@Component
public class RequestIdFilter implements GlobalFilter, Ordered {

    public static final String REQUEST_ID_HEADER = "X-Request-Id";
    public static final String REQUEST_ID_ATTR = "requestId";

    @Override
    public int getOrder() {
        return -110;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        // 1. 检查请求头是否已有 X-Request-Id，有则透传，没有则生成去掉横杠的 UUID
        String requestId = exchange.getRequest().getHeaders().getFirst(REQUEST_ID_HEADER);
        if (requestId == null || requestId.isBlank()) {
            requestId = UUID.randomUUID().toString().replace("-", "");
        }

        // 2. 将 requestId 存入 exchange 属性，方便后续 Filter 使用
        exchange.getAttributes().put(REQUEST_ID_ATTR, requestId);

        // 3. 将 requestId 存入 MDC，方便日志追踪
        MDC.put(REQUEST_ID_ATTR, requestId);

        // 4. 注入到下游请求头
        ServerWebExchange mutatedExchange = exchange.mutate()
                .request(r -> r.header(REQUEST_ID_HEADER, requestId))
                .build();

        return chain.filter(mutatedExchange).then(Mono.fromRunnable(() -> {
            // 5. 写回响应头
            exchange.getResponse().getHeaders().set(REQUEST_ID_HEADER, requestId);
            MDC.remove(REQUEST_ID_ATTR);
        }));
    }
}
