package com.ev.simulator.model;

import lombok.Data;
import java.time.Instant;

@Data
public class TransactionInfo {
    private int transactionId;
    private int connectorId;
    private String idTag;
    private int meterStart;
    private int meterCurrent;
    private Instant startTime;
    private Instant endTime;
    private String status;
}
