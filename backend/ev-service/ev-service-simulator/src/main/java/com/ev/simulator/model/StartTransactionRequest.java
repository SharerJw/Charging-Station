package com.ev.simulator.model;

import lombok.Data;

@Data
public class StartTransactionRequest {
    private Integer connectorId;
    private String idTag;
    private Integer meterStart;
    private String timestamp;
    private Integer reservationId;
}
