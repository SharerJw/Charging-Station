package com.ev.order.websocket;

import com.ev.order.service.DashboardService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
public class DashboardWebSocketHandler extends TextWebSocketHandler {

    private final DashboardService dashboardService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);

    public DashboardWebSocketHandler(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
        // Broadcast dashboard updates every 3 seconds
        scheduler.scheduleAtFixedRate(this::broadcastDashboardUpdate, 3, 3, TimeUnit.SECONDS);
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String sessionId = session.getId();
        sessions.put(sessionId, session);
        log.info("Dashboard WebSocket connected: {}", sessionId);

        // Send initial data
        sendDashboardUpdate(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String sessionId = session.getId();
        sessions.remove(sessionId);
        log.info("Dashboard WebSocket disconnected: {}", sessionId);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        // Client can request specific data updates
        String payload = message.getPayload();
        if ("refresh".equals(payload)) {
            sendDashboardUpdate(session);
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        log.error("Dashboard WebSocket transport error: {}", session.getId(), exception);
        sessions.remove(session.getId());
        if (session.isOpen()) {
            session.close();
        }
    }

    private void broadcastDashboardUpdate() {
        if (sessions.isEmpty()) return;

        try {
            Map<String, Object> dashboardData = getDashboardData();
            String json = objectMapper.writeValueAsString(dashboardData);

            TextMessage message = new TextMessage(json);
            for (WebSocketSession session : sessions.values()) {
                if (session.isOpen()) {
                    try {
                        synchronized(session) {
                            session.sendMessage(message);
                        }
                    } catch (IOException e) {
                        log.error("Error sending dashboard update to session: {}", session.getId(), e);
                        sessions.remove(session.getId());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error broadcasting dashboard update", e);
        }
    }

    private void sendDashboardUpdate(WebSocketSession session) {
        try {
            Map<String, Object> dashboardData = getDashboardData();
            String json = objectMapper.writeValueAsString(dashboardData);

            synchronized(session) {
                session.sendMessage(new TextMessage(json));
            }
        } catch (Exception e) {
            log.error("Error sending dashboard update to session: {}", session.getId(), e);
        }
    }

    private Map<String, Object> getDashboardData() {
        try {
            return Map.of(
                "type", "dashboard_update",
                "stats", dashboardService.stats(),
                "todoCounts", dashboardService.todoCounts(),
                "stationRank", dashboardService.stationRank(5, "revenue"),
                "recentOrders", dashboardService.recentOrders(5)
            );
        } catch (Exception e) {
            log.error("Error getting dashboard data", e);
            return Map.of("type", "dashboard_update", "error", e.getMessage());
        }
    }
}
