package com.ev.common.core.event;

import com.ev.common.core.constant.CommonConstants;
import com.ev.common.core.util.TenantContext;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.Instant;

/**
 * 充电开始事件
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChargingStartedEvent implements Serializable {
    private static final long serialVersionUID = 1L;
    private String orderId;
    private Long stationId;
    private String stationName;
    private Long deviceId;
    private String deviceCode;
    private Integer connectorId;
    private Long userId;
    private String tenantId;
    private Instant timestamp;

    public static ChargingStartedEvent of(String orderId, Long stationId, String stationName,
                                           Long deviceId, String deviceCode, Integer connectorId, Long userId) {
        return ChargingStartedEvent.builder()
                .orderId(orderId).stationId(stationId).stationName(stationName)
                .deviceId(deviceId).deviceCode(deviceCode).connectorId(connectorId)
                .userId(userId).tenantId(TenantContext.getTenantId() != null
                        ? TenantContext.getTenantId() : CommonConstants.DEFAULT_TENANT_ID).timestamp(Instant.now())
                .build();
    }
}
