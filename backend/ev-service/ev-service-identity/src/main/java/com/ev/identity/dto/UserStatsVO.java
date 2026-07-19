package com.ev.identity.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserStatsVO {
    private Integer chargeCount;       // 充电次数
    private Double totalEnergy;        // 总充电量(度)
    private Double totalSaved;         // 总节省(元)
    private Double carbonReduction;    // 碳减排(kg)
}
