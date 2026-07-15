package com.ev.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class StationRankVO {
    private String stationId;
    private String stationName;
    private Long revenue;       // 营收（分）
    private Integer orderCount; // 订单数
    private Long energy;        // 电量（Wh）
}
