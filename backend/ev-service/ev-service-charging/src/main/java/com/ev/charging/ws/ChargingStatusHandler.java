package com.ev.charging.ws;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * WebSocket Handler —— 向用户实时推送充电状态（SOC、功率等）。
 * <p>
 * 会话映射采用双索引：
 * <ul>
 *   <li>{@link #ORDER_SESSIONS}：orderId → WebSocketSession，用于订单维度推送</li>
 *   <li>{@link #USER_SESSIONS}：userId → WebSocketSession，用于用户维度推送</li>
 * </ul>
 */
@Slf4j
@Component
public class ChargingStatusHandler extends TextWebSocketHandler {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    /** orderId -> session */
    private static final Map<String, WebSocketSession> ORDER_SESSIONS = new ConcurrentHashMap<>();
    /** userId -> session */
    private static final Map<String, WebSocketSession> USER_SESSIONS = new ConcurrentHashMap<>();

    // ========================= 连接生命周期 =========================

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String orderId = extractPathParam(session, 0);
        String userId = extractQuery(session, "userId");
        if (orderId != null && !orderId.isBlank()) {
            ORDER_SESSIONS.put(orderId, session);
        }
        if (userId != null && !userId.isBlank()) {
            USER_SESSIONS.put(userId, session);
        }
        log.info("WebSocket连接建立: orderId={}, userId={}", orderId, userId);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String orderId = extractPathParam(session, 0);
        String userId = extractQuery(session, "userId");
        if (orderId != null) {
            ORDER_SESSIONS.remove(orderId);
        }
        if (userId != null) {
            USER_SESSIONS.remove(userId);
        }
        log.info("WebSocket连接关闭: orderId={}, userId={}", orderId, userId);
    }

    // ========================= 推送 API =========================

    /**
     * 按 orderId 推送状态消息（fire-and-forget）。
     */
    public static void sendToOrder(String orderId, Object data) {
        WebSocketSession session = ORDER_SESSIONS.get(orderId);
        sendMessage(session, data, "orderId=" + orderId);
    }

    /**
     * 按 userId 推送状态消息（fire-and-forget）。
     */
    public static void sendToUser(String userId, Object data) {
        WebSocketSession session = USER_SESSIONS.get(userId);
        sendMessage(session, data, "userId=" + userId);
    }

    // ========================= 内部方法 =========================

    private static void sendMessage(WebSocketSession session, Object data, String label) {
        if (session == null || !session.isOpen()) {
            return;
        }
        try {
            session.sendMessage(new TextMessage(MAPPER.writeValueAsString(data)));
        } catch (Exception e) {
            log.warn("WebSocket推送失败: {}, error={}", label, e.getMessage());
        }
    }

    /**
     * 从 URI path 提取路径段。
     * URL 格式: /ws/charging/{orderId}
     * parts: ["", "ws", "charging", "{orderId}"]
     *
     * @param index 从末尾往前数的偏移量（0 = 最后一个段, 1 = 倒数第二个段, ...）
     */
    private String extractPathParam(WebSocketSession session, int index) {
        String uri = session.getUri() != null ? session.getUri().getPath() : "";
        String[] parts = uri.split("/");
        int targetIdx = parts.length - 1 - index;
        return targetIdx >= 0 && targetIdx < parts.length ? parts[targetIdx] : null;
    }

    /**
     * 从 WebSocket URI query 中提取指定参数。
     */
    private String extractQuery(WebSocketSession session, String param) {
        if (session.getUri() == null) {
            return null;
        }
        String query = session.getUri().getQuery();
        if (query == null) {
            return null;
        }
        for (String pair : query.split("&")) {
            String[] kv = pair.split("=", 2);
            if (kv.length == 2 && param.equals(kv[0])) {
                return kv[1];
            }
        }
        return null;
    }
}
