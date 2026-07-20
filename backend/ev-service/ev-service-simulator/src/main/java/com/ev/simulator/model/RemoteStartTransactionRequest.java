package com.ev.simulator.model;

import lombok.Data;

@Data
public class RemoteStartTransactionRequest {
    private String idTag;
    private Integer connectorId;
    private ChargingProfile chargingProfile;
}
