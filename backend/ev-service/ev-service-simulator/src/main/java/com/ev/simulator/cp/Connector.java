package com.ev.simulator.cp;

import com.ev.simulator.model.ConnectorStatus;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;

/**
 * 充电桩连接器状态
 */
@Slf4j
@Data
public class Connector {
    private final int connectorId;
    private ConnectorStatus status;
    private boolean cableLocked;
    private long currentMeterValue; // Wh
    private double currentPower;    // W
    private double voltage;         // V
    private double current;         // A
    private double soc;             // %

    public Connector(int connectorId) {
        this.connectorId = connectorId;
        this.status = ConnectorStatus.Available;
        this.voltage = 750.0;
    }

    public boolean isAvailable() {
        return status == ConnectorStatus.Available;
    }

    public boolean isCharging() {
        return status == ConnectorStatus.Charging;
    }

    public void setStatus(ConnectorStatus newStatus) {
        log.debug("Connector {} status: {} -> {}", connectorId, this.status, newStatus);
        this.status = newStatus;
    }
}
