package com.ev.simulator.dto;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SimStatsVO {
    private Integer totalDevices; private Integer onlineDevices;
    private Integer chargingDevices; private Integer faultDevices;
    private Long totalEnergy; private Integer totalTransactions;
    private Integer averageChargingTime; private Long peakPower;
}
