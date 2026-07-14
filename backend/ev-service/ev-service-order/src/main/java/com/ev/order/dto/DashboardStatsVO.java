package com.ev.order.dto;
import lombok.Builder;
import lombok.Data;

@Data @Builder
public class DashboardStatsVO {
    private Integer stationCount; private Integer deviceCount; private Integer onlineDeviceCount;
    private Integer todayOrderCount; private Long todayRevenue; private Long monthRevenue;
    private Long totalEnergy; private Long todayEnergy;
}
