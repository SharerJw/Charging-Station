package com.ev.simulator.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BootNotificationResponse {
    private String status;
    private Integer interval;
    private String currentTime;
}
