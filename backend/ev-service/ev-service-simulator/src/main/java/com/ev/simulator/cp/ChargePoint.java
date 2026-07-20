package com.ev.simulator.cp;

import com.ev.simulator.model.*;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 充电桩状态机 — 管理 OCPP 1.6 协议状态
 */
@Slf4j
@Data
public class ChargePoint {

    public enum BootState { PENDING, ACCEPTED, REJECTED }

    private final String chargePointId;
    private final String vendor;
    private final String model;
    private String firmwareVersion;
    private BootState bootState = BootState.PENDING;
    private Instant lastHeartbeat;
    private int heartbeatInterval = 30;
    private final Map<Integer, Connector> connectors = new ConcurrentHashMap<>();
    private TransactionInfo activeTransaction;
    private final AtomicInteger transactionIdCounter = new AtomicInteger(1000);

    private static final DateTimeFormatter ISO_FMT =
            DateTimeFormatter.ISO_INSTANT.withZone(ZoneOffset.UTC);

    public ChargePoint(String chargePointId, String vendor, String model) {
        this(chargePointId, vendor, model, 2);
    }

    public ChargePoint(String chargePointId, String vendor, String model, int connectorCount) {
        this.chargePointId = chargePointId;
        this.vendor = vendor;
        this.model = model;
        for (int i = 1; i <= connectorCount; i++) {
            connectors.put(i, new Connector(i));
        }
    }

    // ===== OCPP 1.6 消息处理 =====

    public BootNotificationResponse handleBootNotification(BootNotificationRequest req) {
        this.firmwareVersion = req.getFirmwareVersion();
        this.bootState = BootState.ACCEPTED;
        log.info("[{}] BootNotification accepted - vendor={}, model={}", chargePointId, vendor, model);
        return new BootNotificationResponse("Accepted", heartbeatInterval, ISO_FMT.format(Instant.now()));
    }

    public String handleHeartbeat() {
        this.lastHeartbeat = Instant.now();
        return ISO_FMT.format(Instant.now());
    }

    public void handleStatusNotification(StatusNotificationRequest req) {
        Connector connector = connectors.computeIfAbsent(req.getConnectorId(), Connector::new);
        try {
            connector.setStatus(ConnectorStatus.valueOf(req.getStatus()));
        } catch (IllegalArgumentException e) {
            log.warn("[{}] Unknown connector status: {}", chargePointId, req.getStatus());
        }
        log.info("[{}] StatusNotification: connector{} -> {}", chargePointId, req.getConnectorId(), req.getStatus());
    }

    public AuthorizeResponse handleAuthorize(AuthorizeRequest req) {
        AuthorizeResponse resp = new AuthorizeResponse();
        IdTagInfo info = new IdTagInfo();
        info.setStatus("Accepted");
        resp.setIdTagInfo(info);
        log.info("[{}] Authorize: idTag={} -> Accepted", chargePointId, req.getIdTag());
        return resp;
    }

    public StartTransactionResponse handleStartTransaction(StartTransactionRequest req) {
        Connector connector = connectors.computeIfAbsent(req.getConnectorId(), Connector::new);
        connector.setStatus(ConnectorStatus.Charging);

        TransactionInfo tx = new TransactionInfo();
        tx.setTransactionId(transactionIdCounter.incrementAndGet());
        tx.setConnectorId(req.getConnectorId());
        tx.setIdTag(req.getIdTag());
        tx.setMeterStart(req.getMeterStart() != null ? req.getMeterStart() : 0);
        tx.setMeterCurrent(tx.getMeterStart());
        tx.setStartTime(Instant.now());
        tx.setStatus("Active");

        connector.setCurrentMeterValue(tx.getMeterStart());
        this.activeTransaction = tx;

        log.info("[{}] StartTransaction: connector={}, txId={}, idTag={}",
                chargePointId, req.getConnectorId(), tx.getTransactionId(), req.getIdTag());

        StartTransactionResponse resp = new StartTransactionResponse();
        resp.setTransactionId(tx.getTransactionId());
        IdTagInfo info = new IdTagInfo();
        info.setStatus("Accepted");
        resp.setIdTagInfo(info);
        return resp;
    }

    public StopTransactionResponse handleStopTransaction(StopTransactionRequest req) {
        if (activeTransaction != null && activeTransaction.getTransactionId() == req.getTransactionId()) {
            activeTransaction.setMeterCurrent(
                    req.getMeterStop() != null ? req.getMeterStop() : activeTransaction.getMeterCurrent());
            activeTransaction.setEndTime(Instant.now());
            activeTransaction.setStatus("Completed");

            Connector connector = connectors.get(activeTransaction.getConnectorId());
            if (connector != null) {
                connector.setStatus(ConnectorStatus.Available);
                connector.setCurrentMeterValue(activeTransaction.getMeterCurrent());
            }

            log.info("[{}] StopTransaction: txId={}, meterStop={}, reason={}",
                    chargePointId, req.getTransactionId(), activeTransaction.getMeterCurrent(), req.getReason());
            this.activeTransaction = null;
        }

        StopTransactionResponse resp = new StopTransactionResponse();
        IdTagInfo info = new IdTagInfo();
        info.setStatus("Accepted");
        resp.setIdTagInfo(info);
        return resp;
    }

    public void handleMeterValues(MeterValuesRequest req) {
        if (req.getMeterValue() == null) return;
        Connector connector = connectors.get(req.getConnectorId());
        if (connector == null) return;

        for (MeterValue mv : req.getMeterValue()) {
            if (mv.getSampledValue() == null) continue;
            for (SampledValue sv : mv.getSampledValue()) {
                try {
                    double val = Double.parseDouble(sv.getValue());
                    switch (sv.getMeasurand() != null ? sv.getMeasurand() : "") {
                        case "Energy.Active.Import.Register" -> {
                            connector.setCurrentMeterValue((long) val);
                            if (activeTransaction != null) activeTransaction.setMeterCurrent((int) val);
                        }
                        case "Power.Active.Import" -> connector.setCurrentPower(val);
                        case "Voltage" -> connector.setVoltage(val);
                        case "Current.Import" -> connector.setCurrent(val);
                        case "SoC" -> connector.setSoc(val);
                    }
                } catch (NumberFormatException ignored) {}
            }
        }
    }

    // ===== 远程命令 (CSMS -> CP) =====

    public RemoteStartStopResponse handleRemoteStart(RemoteStartTransactionRequest req) {
        RemoteStartStopResponse resp = new RemoteStartStopResponse();
        resp.setStatus("Accepted");
        log.info("[{}] RemoteStartTransaction accepted: idTag={}, connector={}",
                chargePointId, req.getIdTag(), req.getConnectorId());
        return resp;
    }

    public RemoteStartStopResponse handleRemoteStop(RemoteStopTransactionRequest req) {
        RemoteStartStopResponse resp = new RemoteStartStopResponse();
        resp.setStatus("Accepted");
        log.info("[{}] RemoteStopTransaction accepted: txId={}", chargePointId, req.getTransactionId());
        return resp;
    }

    public Connector getConnector(int id) { return connectors.get(id); }
    public boolean hasActiveTransaction() { return activeTransaction != null; }
    public boolean isOnline() { return bootState == BootState.ACCEPTED; }
}
