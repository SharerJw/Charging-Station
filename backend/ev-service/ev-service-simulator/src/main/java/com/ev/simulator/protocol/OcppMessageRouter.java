package com.ev.simulator.protocol;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ev.simulator.cp.ChargePoint;
import com.ev.simulator.cp.ChargePointRegistry;
import com.ev.simulator.model.*;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * OCPP 消息路由器 — 将 CP 上报的消息分发到对应处理器
 */
@Slf4j
@Component
public class OcppMessageRouter {

    private final Map<String, ChargePointHandler> handlers = new ConcurrentHashMap<>();
    private final ChargePointRegistry registry;
    private final ObjectMapper mapper;

    public OcppMessageRouter(ChargePointRegistry registry, ObjectMapper mapper) {
        this.registry = registry;
        this.mapper = mapper;
    }

    @PostConstruct
    public void init() {
        register("BootNotification", this::handleBootNotification);
        register("Heartbeat", this::handleHeartbeat);
        register("StatusNotification", this::handleStatusNotification);
        register("Authorize", this::handleAuthorize);
        register("StartTransaction", this::handleStartTransaction);
        register("StopTransaction", this::handleStopTransaction);
        register("MeterValues", this::handleMeterValues);
    }

    public void register(String action, ChargePointHandler handler) {
        handlers.put(action, handler);
        log.debug("Registered OCPP handler: {}", action);
    }

    public Object route(String chargePointId, OcppFrame call, OcppSession session) {
        ChargePointHandler handler = handlers.get(call.action());
        if (handler == null) {
            log.warn("[{}] No handler for OCPP action: {}", chargePointId, call.action());
            return null;
        }
        try {
            return handler.handle(chargePointId, call.payload(), session);
        } catch (Exception e) {
            log.error("[{}] Error handling {}: {}", chargePointId, call.action(), e.getMessage(), e);
            return null;
        }
    }

    // ===== Handler Implementations =====

    private Object handleBootNotification(String cpId, Object payload, OcppSession session) {
        BootNotificationRequest req = mapper.convertValue(payload, BootNotificationRequest.class);
        ChargePoint cp = registry.register(cpId, req.getChargePointVendor(), req.getChargePointModel());
        session.setChargePointId(cpId);
        session.setBootAccepted(true);
        return cp.handleBootNotification(req);
    }

    private Object handleHeartbeat(String cpId, Object payload, OcppSession session) {
        ChargePoint cp = registry.get(cpId);
        if (cp == null) return null;
        session.setLastHeartbeat(Instant.now());
        return Map.of("currentTime", cp.handleHeartbeat());
    }

    private Object handleStatusNotification(String cpId, Object payload, OcppSession session) {
        StatusNotificationRequest req = mapper.convertValue(payload, StatusNotificationRequest.class);
        ChargePoint cp = registry.get(cpId);
        if (cp != null) cp.handleStatusNotification(req);
        return Map.of();
    }

    private Object handleAuthorize(String cpId, Object payload, OcppSession session) {
        AuthorizeRequest req = mapper.convertValue(payload, AuthorizeRequest.class);
        ChargePoint cp = registry.get(cpId);
        return cp != null ? cp.handleAuthorize(req) : null;
    }

    private Object handleStartTransaction(String cpId, Object payload, OcppSession session) {
        StartTransactionRequest req = mapper.convertValue(payload, StartTransactionRequest.class);
        ChargePoint cp = registry.get(cpId);
        return cp != null ? cp.handleStartTransaction(req) : null;
    }

    private Object handleStopTransaction(String cpId, Object payload, OcppSession session) {
        StopTransactionRequest req = mapper.convertValue(payload, StopTransactionRequest.class);
        ChargePoint cp = registry.get(cpId);
        return cp != null ? cp.handleStopTransaction(req) : null;
    }

    private Object handleMeterValues(String cpId, Object payload, OcppSession session) {
        MeterValuesRequest req = mapper.convertValue(payload, MeterValuesRequest.class);
        ChargePoint cp = registry.get(cpId);
        if (cp != null) cp.handleMeterValues(req);
        return Map.of();
    }
}
