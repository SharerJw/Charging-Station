package com.ev.common.core.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.Instant;

/**
 * 设备状态变更事件
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceStatusChangedEvent implements Serializable {
    private static final long serialVersionUID = 1L;
    private Long deviceId;
    private String deviceCode;
    private Long stationId;
    private String stationName;
    private String oldStatus;
    private String newStatus;
    private String tenantId;
    private Instant timestamp;
}
