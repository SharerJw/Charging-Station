package com.ev.simulator.protocol;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.time.Instant;
import java.util.Collection;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * OCPP WebSocket 处理器
 * - /ws/ocpp              → 前端仪表盘（接收广播事件）
 * - /ws/cp/{chargePointId} → 充电桩连接（OCPP-J 协议）
 */
@Slf4j
@Component
public class OcppWebSocketHandler extends TextWebSocketHandler {

    private final OcppFrameCodec codec;
    private final OcppMessageRouter router;
    private final ObjectMapper mapper;

    private final Map<String, OcppSession> cpSessions = new ConcurrentHashMap<>();
    private final Set<WebSocketSession> uiSessions = ConcurrentHashMap.newKeySet();

    public OcppWebSocketHandler(OcppFrameCodec codec, OcppMessageRouter router, ObjectMapper mapper) {
        this.codec = codec;
        this.router = router;
        this.mapper = mapper;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String path = session.getUri() != null ? session.getUri().getPath() : "";

        if (path.startsWith("/ws/cp/")) {
            String cpId = extractChargePointId(path);
            OcppSession ocppSession = new OcppSession(session);
            ocppSession.setChargePointId(cpId);
            cpSessions.put(cpId, ocppSession);
            log.info("[{}] CP WebSocket connected", cpId);
            broadcastToUI("ConnectionChanged", cpId, Map.of(
                    "status", "connected", "chargePointId", cpId,
                    "timestamp", Instant.now().toString()));
        } else if (path.equals("/ws/ocpp")) {
            uiSessions.add(session);
            log.info("UI dashboard WebSocket connected");
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String path = session.getUri() != null ? session.getUri().getPath() : "";

        if (path.startsWith("/ws/cp/")) {
            String cpId = extractChargePointId(path);
            cpSessions.remove(cpId);
            log.info("[{}] CP WebSocket disconnected: {}", cpId, status);
            broadcastToUI("ConnectionChanged", cpId, Map.of(
                    "status", "disconnected", "chargePointId", cpId,
                    "timestamp", Instant.now().toString()));
        } else {
            uiSessions.remove(session);
            log.info("UI dashboard WebSocket disconnected: {}", status);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        String path = session.getUri() != null ? session.getUri().getPath() : "";

        if (path.equals("/ws/ocpp")) {
            handleUICommand(session, message.getPayload());
            return;
        }

        String cpId = extractChargePointId(path);
        OcppSession ocppSession = cpSessions.get(cpId);
        if (ocppSession == null) {
            log.warn("Message from unknown CP: {}", cpId);
            return;
        }

        try {
            OcppFrame frame = codec.decode(message.getPayload());

            switch (frame.type()) {
                case CALL -> {
                    broadcastToUI(frame.action(), cpId, Map.of(
                            "type", "Call", "messageId", frame.messageId(),
                            "action", frame.action(), "payload", frame.payload(),
                            "direction", "inbound", "timestamp", Instant.now().toString(),
                            "chargePointId", cpId));

                    Object result = router.route(cpId, frame, ocppSession);
                    OcppFrame response = OcppFrame.callResult(frame.messageId(),
                            result != null ? mapper.valueToTree(result) : mapper.createObjectNode());
                    sendMessage(session, codec.encode(response));

                    broadcastToUI(frame.action() + "Response", cpId, Map.of(
                            "type", "CallResult", "messageId", frame.messageId(),
                            "action", frame.action(), "payload", response.payload(),
                            "direction", "outbound", "timestamp", Instant.now().toString(),
                            "chargePointId", cpId));
                }
                case CALL_RESULT -> {
                    ocppSession.completePendingCall(frame.messageId(), frame);
                    broadcastToUI("CallResult", cpId, Map.of(
                            "type", "CallResult", "messageId", frame.messageId(),
                            "payload", frame.payload(), "direction", "inbound",
                            "timestamp", Instant.now().toString(), "chargePointId", cpId));
                }
                case CALL_ERROR -> {
                    log.error("[{}] CallError: {} - {}", cpId, frame.errorCode(), frame.errorDescription());
                    ocppSession.completePendingCall(frame.messageId(), frame);
                    broadcastToUI("CallError", cpId, Map.of(
                            "type", "CallError", "messageId", frame.messageId(),
                            "errorCode", frame.errorCode(), "errorDescription", frame.errorDescription(),
                            "direction", "inbound", "timestamp", Instant.now().toString(),
                            "chargePointId", cpId));
                }
            }
        } catch (Exception e) {
            log.error("[{}] Failed to handle message: {}", cpId, e.getMessage(), e);
            sendMessage(session, codec.encode(
                    OcppFrame.callError("0", "InternalError", e.getMessage(), null)));
        }
    }

    // ===== 公共 API =====

    public boolean sendToChargePoint(String chargePointId, String action, Object payload) {
        OcppSession session = cpSessions.get(chargePointId);
        if (session == null || !session.getWebSocketSession().isOpen()) {
            log.warn("[{}] CP not connected, cannot send {}", chargePointId, action);
            return false;
        }

        String messageId = UUID.randomUUID().toString();
        OcppFrame call = OcppFrame.call(messageId, action, mapper.valueToTree(payload));

        broadcastToUI(action, chargePointId, Map.of(
                "type", "Call", "messageId", messageId, "action", action,
                "payload", call.payload(), "direction", "outbound",
                "timestamp", Instant.now().toString(), "chargePointId", chargePointId));

        return sendMessage(session.getWebSocketSession(), codec.encode(call));
    }

    public void broadcastToUI(String action, String chargePointId, Object data) {
        if (uiSessions.isEmpty()) return;
        try {
            ObjectNode msg = mapper.createObjectNode();
            msg.put("messageId", UUID.randomUUID().toString().substring(0, 8));
            msg.put("action", action);
            msg.put("type", "Event");
            msg.set("payload", mapper.valueToTree(data));
            msg.put("timestamp", Instant.now().toString());
            msg.put("chargePointId", chargePointId);

            TextMessage textMsg = new TextMessage(mapper.writeValueAsString(msg));
            uiSessions.removeIf(s -> !s.isOpen());
            for (WebSocketSession ui : uiSessions) {
                if (ui.isOpen()) ui.sendMessage(textMsg);
            }
        } catch (Exception e) {
            log.error("Failed to broadcast to UI: {}", e.getMessage());
        }
    }

    public boolean isChargePointConnected(String chargePointId) {
        OcppSession session = cpSessions.get(chargePointId);
        return session != null && session.getWebSocketSession().isOpen();
    }

    public Collection<String> getConnectedChargePointIds() {
        return cpSessions.keySet();
    }

    // ===== Internal =====

    private String extractChargePointId(String path) {
        String[] parts = path.split("/");
        return parts.length >= 4 ? parts[3] : "unknown";
    }

    private boolean sendMessage(WebSocketSession session, String message) {
        try {
            if (session.isOpen()) {
                session.sendMessage(new TextMessage(message));
                return true;
            }
        } catch (IOException e) {
            log.error("Failed to send WebSocket message: {}", e.getMessage());
        }
        return false;
    }

    private void handleUICommand(WebSocketSession session, String payload) {
        try {
            var node = mapper.readTree(payload);
            String action = node.has("action") ? node.get("action").asText() : null;
            String targetCp = node.has("chargePointId") ? node.get("chargePointId").asText() : null;
            Object cmdPayload = node.has("payload") ?
                    mapper.treeToValue(node.get("payload"), Object.class) : null;
            if (action != null && targetCp != null) {
                sendToChargePoint(targetCp, action, cmdPayload);
            }
        } catch (Exception e) {
            log.error("Failed to handle UI command: {}", e.getMessage());
        }
    }
}
