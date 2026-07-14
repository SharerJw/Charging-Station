package com.ev.order.dto;
import lombok.Builder;
import lombok.Data;

@Data @Builder
public class FinanceSummaryVO {
    private Long totalRevenue; private Long totalElectricityFee; private Long totalServiceFee;
    private Integer totalOrderCount; private Long totalEnergyWh; private Long avgOrderAmount;
    private Long refundAmount; private Integer refundCount;
}
