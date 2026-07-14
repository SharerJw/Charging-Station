package com.ev.simulator.dto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SimDeviceVO {
    private String id; private String name; private String ocppId; private String model;
    private String status; // online/offline/charging/fault
    private Long power; private Long voltage; private Long current;
    private Integer soc; private Integer temperature;
    private String lastHeartbeat;
}
