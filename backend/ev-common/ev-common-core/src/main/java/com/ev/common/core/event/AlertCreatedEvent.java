package com.ev.common.core.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.Instant;

/**
 * 告警创建事件
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlertCreatedEvent implements Serializable {
    private static final long serialVersionUID = 1L;
    private Long alertId;
    private String level;
    private String title;
    private String description;
    private Long stationId;
    private String stationName;
    private String deviceCode;
    private String tenantId;
    private Instant timestamp;
}
