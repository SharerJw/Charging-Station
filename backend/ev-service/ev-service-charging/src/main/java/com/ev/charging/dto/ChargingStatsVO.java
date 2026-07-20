package com.ev.charging.dto;

import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 充电统计数据 VO
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ChargingStatsVO {
    /** 统计周期内总充电次数 */
    private Long totalSessions;
    /** 总充电量（Wh） */
    private Long totalEnergyWh;
    /** 总费用（分） */
    private Long totalCostCents;
    /** 总充电时长（秒） */
    private Long totalDurationSec;
    /** 平均单次充电量（Wh） */
    private Long avgEnergyWh;
    /** 平均单次费用（分） */
    private Long avgCostCents;
    /** 平均单次时长（秒） */
    private Long avgDurationSec;
    /** 完成率（%） */
    private Integer completionRate;
}
