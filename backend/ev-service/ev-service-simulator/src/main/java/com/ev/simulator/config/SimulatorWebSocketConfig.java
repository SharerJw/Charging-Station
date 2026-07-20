package com.ev.simulator.config;

import com.ev.simulator.protocol.OcppWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

/**
 * 模拟器 WebSocket 配置
 * /ws/ocpp          — 前端仪表盘连接
 * /ws/cp/{cpId}     — 充电桩 OCPP-J 连接
 */
@Configuration
@EnableWebSocket
public class SimulatorWebSocketConfig implements WebSocketConfigurer {

    private final OcppWebSocketHandler handler;

    public SimulatorWebSocketConfig(OcppWebSocketHandler handler) {
        this.handler = handler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(handler, "/ws/ocpp")
                .setAllowedOrigins("*");
        registry.addHandler(handler, "/ws/cp/{chargePointId}")
                .setAllowedOrigins("*");
    }
}
