package com.ev.simulator.cp;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 充电桩注册表 — 管理所有已连接的充电桩
 */
@Slf4j
@Component
public class ChargePointRegistry {

    private final Map<String, ChargePoint> chargePoints = new ConcurrentHashMap<>();

    public ChargePoint register(String chargePointId, String vendor, String model) {
        return register(chargePointId, vendor, model, 2);
    }

    public ChargePoint register(String chargePointId, String vendor, String model, int connectorCount) {
        return chargePoints.computeIfAbsent(chargePointId, id -> {
            ChargePoint cp = new ChargePoint(id, vendor, model, connectorCount);
            log.info("[{}] Charge point registered: vendor={}, model={}, connectors={}",
                    id, vendor, model, connectorCount);
            return cp;
        });
    }

    public ChargePoint get(String chargePointId) {
        return chargePoints.get(chargePointId);
    }

    public void remove(String chargePointId) {
        ChargePoint removed = chargePoints.remove(chargePointId);
        if (removed != null) {
            log.info("[{}] Charge point removed from registry", chargePointId);
        }
    }

    public Collection<ChargePoint> all() {
        return chargePoints.values();
    }

    public int onlineCount() {
        return (int) chargePoints.values().stream().filter(ChargePoint::isOnline).count();
    }

    public int totalCount() {
        return chargePoints.size();
    }
}
