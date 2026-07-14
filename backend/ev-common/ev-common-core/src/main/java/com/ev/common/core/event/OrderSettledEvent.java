package com.ev.common.core.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.Instant;

/**
 * 订单结算完成事件
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderSettledEvent implements Serializable {
    private static final long serialVersionUID = 1L;
    private Long orderId;
    private String orderNo;
    private Long userId;
    private Long stationId;
    private Long totalAmount;
    private Long energyWh;
    private String tenantId;
    private Instant timestamp;
}
