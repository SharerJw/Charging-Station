package com.ev.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TodoCountsVO {
    private Integer pendingAlerts;      // 待处理告警
    private Integer pendingWorkOrders;  // 待办工单
    private Integer settledOrders;      // 待结算订单
    private Integer refundingOrders;    // 退款中订单
}
