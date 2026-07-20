package com.ev.simulator.engine;

import com.ev.simulator.cp.ChargePoint;
import com.ev.simulator.cp.ChargePointRegistry;
import com.ev.simulator.cp.Connector;
import com.ev.simulator.dto.SimTransactionVO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

@Slf4j
@Component
public class ChargingSimulator {

    @Autowired
    private ChargePointRegistry chargePointRegistry;

    private final Map<String, SimTransactionVO> transactions = new ConcurrentHashMap<>();
    private int txCounter = 1000;

    public SimTransactionVO startCharging(String chargePointId, int connectorId, String idTag, int targetSoc) {
        int txId = ++txCounter;
        String id = "TX" + System.currentTimeMillis();
        log.info("模拟充电开始: cp={}, connector={}, txId={}", chargePointId, connectorId, txId);

        SimTransactionVO tx = SimTransactionVO.builder()
                .id(id).transactionId(txId).chargePointId(chargePointId)
                .connectorId(connectorId).idTag(idTag).status("active")
                .startTimestamp(Instant.now().toString()).meterStart(0L)
                .energy(0L).power(0L).soc(20 + ThreadLocalRandom.current().nextInt(10))
                .voltage(750L).current(0L)
                .build();

        transactions.put(id, tx);
        return tx;
    }

    public SimTransactionVO stopCharging(String txId) {
        SimTransactionVO tx = transactions.get(txId);
        if (tx == null) {
            return SimTransactionVO.builder()
                    .id(txId).status("completed").meterStop(45000L)
                    .energy(45000L).soc(80).stopTimestamp(Instant.now().toString())
                    .build();
        }
        tx = SimTransactionVO.builder()
                .id(tx.getId()).transactionId(tx.getTransactionId())
                .chargePointId(tx.getChargePointId()).connectorId(tx.getConnectorId())
                .idTag(tx.getIdTag()).status("completed")
                .startTimestamp(tx.getStartTimestamp()).stopTimestamp(Instant.now().toString())
                .meterStart(tx.getMeterStart()).meterStop(tx.getMeterStart() + tx.getEnergy())
                .energy(tx.getEnergy()).soc(80).power(0L).voltage(0L).current(0L)
                .build();
        transactions.remove(txId);
        log.info("模拟充电结束: txId={}, energy={}Wh", txId, tx.getEnergy());
        return tx;
    }

    public SimTransactionVO getTransaction(String txId) {
        SimTransactionVO tx = transactions.get(txId);
        if (tx == null) {
            return SimTransactionVO.builder().id(txId).status("unknown").build();
        }

        // 优先从 ChargePointRegistry 读取真实仪表值
        ChargePoint cp = chargePointRegistry.get(tx.getChargePointId());
        if (cp != null && cp.hasActiveTransaction()) {
            var activeTx = cp.getActiveTransaction();
            Connector connector = cp.getConnector(tx.getConnectorId());
            if (connector != null && activeTx.getTransactionId() == tx.getTransactionId()) {
                long energy = connector.getCurrentMeterValue() - tx.getMeterStart();
                return SimTransactionVO.builder()
                        .id(tx.getId()).transactionId(tx.getTransactionId())
                        .chargePointId(tx.getChargePointId()).connectorId(tx.getConnectorId())
                        .idTag(tx.getIdTag()).status("active")
                        .startTimestamp(tx.getStartTimestamp())
                        .meterStart(tx.getMeterStart()).meterStop(connector.getCurrentMeterValue())
                        .energy(Math.max(0, energy)).soc((int) connector.getSoc())
                        .power((long) connector.getCurrentPower())
                        .voltage((long) connector.getVoltage())
                        .current((long) connector.getCurrent())
                        .build();
            }
        }

        // 回退到随机模拟值
        int newSoc = Math.min(tx.getSoc() + ThreadLocalRandom.current().nextInt(1, 5), 95);
        long newEnergy = tx.getEnergy() + ThreadLocalRandom.current().nextLong(200, 800);
        return SimTransactionVO.builder()
                .id(tx.getId()).transactionId(tx.getTransactionId())
                .chargePointId(tx.getChargePointId()).connectorId(tx.getConnectorId())
                .idTag(tx.getIdTag()).status("active")
                .startTimestamp(tx.getStartTimestamp())
                .meterStart(tx.getMeterStart()).energy(newEnergy).soc(newSoc)
                .power(90000L + ThreadLocalRandom.current().nextLong(30000L))
                .voltage(750L).current(120L + ThreadLocalRandom.current().nextLong(20L))
                .build();
    }

    public SimTransactionVO findByChargePointAndConnector(String chargePointId, int connectorId) {
        return transactions.values().stream()
                .filter(tx -> chargePointId.equals(tx.getChargePointId())
                        && connectorId == (tx.getConnectorId() != null ? tx.getConnectorId() : 0))
                .findFirst()
                .orElse(SimTransactionVO.builder()
                        .chargePointId(chargePointId).connectorId(connectorId)
                        .status("unknown").build());
    }

    public SimTransactionVO stopByChargePointAndConnector(String chargePointId, int connectorId) {
        SimTransactionVO found = transactions.values().stream()
                .filter(tx -> chargePointId.equals(tx.getChargePointId())
                        && connectorId == (tx.getConnectorId() != null ? tx.getConnectorId() : 0))
                .findFirst()
                .orElse(null);
        if (found == null) {
            return SimTransactionVO.builder()
                    .chargePointId(chargePointId).connectorId(connectorId)
                    .status("completed").meterStop(45000L).energy(45000L)
                    .soc(80).stopTimestamp(Instant.now().toString())
                    .build();
        }
        return stopCharging(found.getId());
    }

    public Map<String, SimTransactionVO> getAllTransactions() {
        return transactions;
    }
}
