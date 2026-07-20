package com.ev.simulator.engine;

import com.ev.simulator.cp.ChargePoint;
import com.ev.simulator.cp.ChargePointRegistry;
import com.ev.simulator.model.*;
import com.ev.simulator.protocol.OcppWebSocketHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * 场景步骤执行器 — 将场景步骤转换为 OCPP 命令并执行
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ScenarioStepExecutor {

    private final OcppWebSocketHandler wsHandler;
    private final ChargePointRegistry registry;

    /**
     * 执行一组场景步骤
     */
    public CompletableFuture<Boolean> executeScenario(String chargePointId, List<Map<String, Object>> steps) {
        return CompletableFuture.supplyAsync(() -> {
            log.info("[{}] Starting scenario: {} steps", chargePointId, steps.size());
            for (int i = 0; i < steps.size(); i++) {
                Map<String, Object> step = steps.get(i);
                String type = (String) step.get("type");

                log.info("[{}] Step {}/{}: {}", chargePointId, i + 1, steps.size(), type);
                wsHandler.broadcastToUI("ScenarioStep", chargePointId, Map.of(
                        "stepIndex", i, "totalSteps", steps.size(),
                        "stepType", type, "status", "running"));

                try {
                    boolean ok = executeStep(chargePointId, step).get();
                    if (!ok) {
                        log.warn("[{}] Step {} failed, aborting", chargePointId, type);
                        return false;
                    }
                } catch (Exception e) {
                    log.error("[{}] Step {} error: {}", chargePointId, type, e.getMessage());
                    return false;
                }
            }
            log.info("[{}] Scenario completed", chargePointId);
            return true;
        });
    }

    public CompletableFuture<Boolean> executeStep(String chargePointId, Map<String, Object> step) {
        String type = (String) step.getOrDefault("type", "");
        return switch (type.toUpperCase()) {
            case "REMOTE_START" -> handleRemoteStart(chargePointId, step);
            case "REMOTE_STOP" -> handleRemoteStop(chargePointId, step);
            case "WAIT" -> handleWait(step);
            case "METER_VALUES" -> handleMeterSimulation(chargePointId, step);
            case "INJECT_FAULT" -> handleInjectFault(chargePointId, step);
            case "STATUS_CHANGE" -> handleStatusChange(chargePointId, step);
            case "CONNECT" -> CompletableFuture.completedFuture(true); // already connected
            default -> {
                log.warn("[{}] Unknown step type: {}", chargePointId, type);
                yield CompletableFuture.completedFuture(false);
            }
        };
    }

    private CompletableFuture<Boolean> handleRemoteStart(String cpId, Map<String, Object> step) {
        ChargePoint cp = registry.get(cpId);
        if (cp == null) return CompletableFuture.completedFuture(false);

        int connectorId = step.containsKey("connectorId") ?
                ((Number) step.get("connectorId")).intValue() : 1;
        String idTag = (String) step.getOrDefault("idTag", "USER001");

        // StatusNotification(Preparing)
        StatusNotificationRequest prep = new StatusNotificationRequest();
        prep.setConnectorId(connectorId);
        prep.setStatus("Preparing");
        prep.setErrorCode("NoError");
        cp.handleStatusNotification(prep);
        wsHandler.broadcastToUI("StatusNotification", cpId,
                Map.of("connectorId", connectorId, "status", "Preparing"));

        // Authorize
        AuthorizeRequest authReq = new AuthorizeRequest();
        authReq.setIdTag(idTag);
        cp.handleAuthorize(authReq);

        // StartTransaction
        StartTransactionRequest startReq = new StartTransactionRequest();
        startReq.setConnectorId(connectorId);
        startReq.setIdTag(idTag);
        startReq.setMeterStart(0);
        startReq.setTimestamp(Instant.now().toString());
        StartTransactionResponse startResp = cp.handleStartTransaction(startReq);

        // StatusNotification(Charging)
        StatusNotificationRequest charging = new StatusNotificationRequest();
        charging.setConnectorId(connectorId);
        charging.setStatus("Charging");
        charging.setErrorCode("NoError");
        cp.handleStatusNotification(charging);
        wsHandler.broadcastToUI("StatusNotification", cpId,
                Map.of("connectorId", connectorId, "status", "Charging",
                        "transactionId", startResp.getTransactionId()));

        log.info("[{}] RemoteStart simulated: txId={}", cpId, startResp.getTransactionId());
        return CompletableFuture.completedFuture(true);
    }

    private CompletableFuture<Boolean> handleRemoteStop(String cpId, Map<String, Object> step) {
        ChargePoint cp = registry.get(cpId);
        if (cp == null || !cp.hasActiveTransaction())
            return CompletableFuture.completedFuture(false);

        String reason = (String) step.getOrDefault("reason", "Remote");
        int txId = cp.getActiveTransaction().getTransactionId();
        int meterStop = cp.getActiveTransaction().getMeterCurrent();

        StopTransactionRequest stopReq = new StopTransactionRequest();
        stopReq.setTransactionId(txId);
        stopReq.setMeterStop(meterStop);
        stopReq.setTimestamp(Instant.now().toString());
        stopReq.setReason(reason);
        cp.handleStopTransaction(stopReq);

        wsHandler.broadcastToUI("StopTransaction", cpId,
                Map.of("transactionId", txId, "meterStop", meterStop, "reason", reason));
        log.info("[{}] RemoteStop simulated: txId={}", cpId, txId);
        return CompletableFuture.completedFuture(true);
    }

    private CompletableFuture<Boolean> handleWait(Map<String, Object> step) {
        int duration = step.containsKey("duration") ?
                ((Number) step.get("duration")).intValue() : 5;
        try {
            Thread.sleep(Math.min(duration, 300) * 1000L);
            return CompletableFuture.completedFuture(true);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return CompletableFuture.completedFuture(false);
        }
    }

    private CompletableFuture<Boolean> handleMeterSimulation(String cpId, Map<String, Object> step) {
        ChargePoint cp = registry.get(cpId);
        if (cp == null || !cp.hasActiveTransaction())
            return CompletableFuture.completedFuture(false);

        int interval = step.containsKey("interval") ? ((Number) step.get("interval")).intValue() : 5;
        int count = step.containsKey("count") ? ((Number) step.get("count")).intValue() : 6;
        double powerW = step.containsKey("power") ? ((Number) step.get("power")).doubleValue() : 120000;

        for (int i = 0; i < count; i++) {
            if (!cp.hasActiveTransaction()) break;
            var tx = cp.getActiveTransaction();
            double soc = 20.0 + (70.0 * i / count);
            int energy = tx.getMeterStart() + (int) (powerW * interval * (i + 1) / 3600);

            SampledValue energySv = new SampledValue();
            energySv.setValue(String.valueOf(energy));
            energySv.setMeasurand("Energy.Active.Import.Register");
            energySv.setUnit("Wh");
            energySv.setContext("Sample.Periodic");

            SampledValue powerSv = new SampledValue();
            powerSv.setValue(String.valueOf((int) powerW));
            powerSv.setMeasurand("Power.Active.Import");
            powerSv.setUnit("W");

            SampledValue socSv = new SampledValue();
            socSv.setValue(String.format("%.1f", soc));
            socSv.setMeasurand("SoC");
            socSv.setUnit("Percent");

            SampledValue voltSv = new SampledValue();
            voltSv.setValue("750");
            voltSv.setMeasurand("Voltage");
            voltSv.setUnit("V");

            SampledValue currSv = new SampledValue();
            currSv.setValue(String.format("%.1f", powerW / 750));
            currSv.setMeasurand("Current.Import");
            currSv.setUnit("A");

            MeterValue mv = new MeterValue();
            mv.setTimestamp(Instant.now().toString());
            mv.setSampledValue(List.of(energySv, powerSv, socSv, voltSv, currSv));

            MeterValuesRequest mvReq = new MeterValuesRequest();
            mvReq.setConnectorId(tx.getConnectorId());
            mvReq.setTransactionId(tx.getTransactionId());
            mvReq.setMeterValue(List.of(mv));

            cp.handleMeterValues(mvReq);

            wsHandler.broadcastToUI("MeterValues", cpId, Map.of(
                    "transactionId", tx.getTransactionId(), "energy", energy,
                    "power", (int) powerW, "soc", soc, "connectorId", tx.getConnectorId()));

            try {
                Thread.sleep(interval * 1000L);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return CompletableFuture.completedFuture(false);
            }
        }
        return CompletableFuture.completedFuture(true);
    }

    private CompletableFuture<Boolean> handleInjectFault(String cpId, Map<String, Object> step) {
        ChargePoint cp = registry.get(cpId);
        if (cp == null) return CompletableFuture.completedFuture(false);

        String faultType = (String) step.getOrDefault("faultType", "PowerMeterFailure");
        int connId = cp.hasActiveTransaction() ? cp.getActiveTransaction().getConnectorId() : 1;

        StatusNotificationRequest req = new StatusNotificationRequest();
        req.setConnectorId(connId);
        req.setStatus("Faulted");
        req.setErrorCode(faultType);
        cp.handleStatusNotification(req);

        wsHandler.broadcastToUI("FaultInjected", cpId,
                Map.of("faultType", faultType, "connectorId", connId));
        log.info("[{}] Fault injected: {}", cpId, faultType);
        return CompletableFuture.completedFuture(true);
    }

    private CompletableFuture<Boolean> handleStatusChange(String cpId, Map<String, Object> step) {
        ChargePoint cp = registry.get(cpId);
        if (cp == null) return CompletableFuture.completedFuture(false);

        int connId = step.containsKey("connectorId") ?
                ((Number) step.get("connectorId")).intValue() : 1;
        String status = (String) step.getOrDefault("status", "Available");

        StatusNotificationRequest req = new StatusNotificationRequest();
        req.setConnectorId(connId);
        req.setStatus(status);
        req.setErrorCode("NoError");
        cp.handleStatusNotification(req);

        wsHandler.broadcastToUI("StatusNotification", cpId,
                Map.of("connectorId", connId, "status", status));
        return CompletableFuture.completedFuture(true);
    }
}
