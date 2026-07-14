package com.ev.charging.dto;

import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ChargingSessionVO {
    private String orderId;
    private String stationName;
    private String deviceCode;
    private String status; // charging/completed/error
    private Integer currentSoc;
    private Long power;      // W
    private Long energy;     // Wh
    private Long duration;   // seconds
    private Long cost;       // cents
    private String startTime;
}
