package com.ev.charging.ws;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
public class ChargingStatusHandler extends TextWebSocketHandler {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final Map<String, WebSocketSession> SESSIONS = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String orderId = extractOrderId(session);
        SESSIONS.put(orderId, session);
        log.info("WebSocket连接建立: orderId={}", orderId);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String orderId = extractOrderId(session);
        SESSIONS.remove(orderId);
        log.info("WebSocket连接关闭: orderId={}", orderId);
    }

    public static void sendStatus(String orderId, Object data) {
        WebSocketSession session = SESSIONS.get(orderId);
        if (session != null && session.isOpen()) {
            try {
                session.sendMessage(new TextMessage(MAPPER.writeValueAsString(data)));
            } catch (Exception e) {
                log.warn("WebSocket推送失败: orderId={}", orderId, e);
            }
        }
    }

    private String extractOrderId(WebSocketSession session) {
        String uri = session.getUri() != null ? session.getUri().getPath() : "";
        String[] parts = uri.split("/");
        return parts.length > 0 ? parts[parts.length - 1] : "unknown";
    }
}
