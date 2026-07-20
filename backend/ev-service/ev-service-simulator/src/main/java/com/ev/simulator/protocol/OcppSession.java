package com.ev.simulator.protocol;

import lombok.Data;
import org.springframework.web.socket.WebSocketSession;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

/**
 * OCPP 会话 — 每个充电桩连接一个
 */
@Data
public class OcppSession {
    private String chargePointId;
    private WebSocketSession webSocketSession;
    private Instant connectedAt;
    private Instant lastHeartbeat;
    private boolean bootAccepted;

    private final Map<String, CompletableFuture<OcppFrame>> pendingCalls = new ConcurrentHashMap<>();

    public OcppSession(WebSocketSession session) {
        this.webSocketSession = session;
        this.connectedAt = Instant.now();
    }

    public void addPendingCall(String messageId, CompletableFuture<OcppFrame> future) {
        pendingCalls.put(messageId, future);
    }

    public void completePendingCall(String messageId, OcppFrame result) {
        CompletableFuture<OcppFrame> future = pendingCalls.remove(messageId);
        if (future != null) {
            future.complete(result);
        }
    }
}
