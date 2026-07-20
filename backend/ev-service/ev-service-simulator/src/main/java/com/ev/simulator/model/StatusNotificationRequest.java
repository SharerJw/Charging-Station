package com.ev.simulator.model;

import lombok.Data;

@Data
public class StatusNotificationRequest {
    private Integer connectorId;
    private String errorCode;
    private String status;
    private String info;
    private String timestamp;
    private String vendorId;
    private String vendorErrorCode;
}
