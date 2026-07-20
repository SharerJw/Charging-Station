package com.ev.charging.ws;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class ChargingWebSocketConfig implements WebSocketConfigurer {

    private final ChargingStatusHandler chargingStatusHandler;

    /**
     * 允许的前端源列表，可通过 application.yml 配置覆盖。
     * 默认值包含四端开发服务器地址。
     */
    @Value("${websocket.allowed-origins:" +
            "http://localhost:5173," +
            "http://localhost:5175," +
            "http://localhost:5176," +
            "http://localhost:5177," +
            "http://127.0.0.1:5173," +
            "http://127.0.0.1:5175," +
            "http://127.0.0.1:5176," +
            "http://127.0.0.1:5177}")
    private String allowedOrigins;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(chargingStatusHandler, "/ws/charging/{orderId}")
                .setAllowedOrigins(allowedOrigins.split(","));
    }
}
