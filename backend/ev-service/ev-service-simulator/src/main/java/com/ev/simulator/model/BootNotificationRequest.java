package com.ev.simulator.model;

import lombok.Data;

@Data
public class BootNotificationRequest {
    private String chargePointVendor;
    private String chargePointModel;
    private String chargePointSerialNumber;
    private String firmwareVersion;
    private String iccid;
    private String imsi;
}
