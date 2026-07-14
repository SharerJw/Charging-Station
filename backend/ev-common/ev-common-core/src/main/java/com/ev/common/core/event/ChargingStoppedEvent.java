package com.ev.common.core.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.Instant;

/**
 * 充电结束事件
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChargingStoppedEvent implements Serializable {
    private static final long serialVersionUID = 1L;
    private String orderId;
    private Long stationId;
    private String stationName;
    private Long deviceId;
    private String deviceCode;
    private Long userId;
    private Long energyWh;
    private Long totalAmount;
    private Long durationSeconds;
    private String tenantId;
    private Instant timestamp;

    public static ChargingStoppedEvent of(String orderId, Long stationId, Long energyWh, Long totalAmount, Long duration) {
        return ChargingStoppedEvent.builder()
                .orderId(orderId).stationId(stationId).energyWh(energyWh)
                .totalAmount(totalAmount).durationSeconds(duration)
                .tenantId("T001").timestamp(Instant.now())
                .build();
    }
}
