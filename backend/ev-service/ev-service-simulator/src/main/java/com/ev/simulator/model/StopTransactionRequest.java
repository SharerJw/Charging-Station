package com.ev.simulator.model;

import lombok.Data;
import java.util.List;

@Data
public class StopTransactionRequest {
    private Integer transactionId;
    private String idTag;
    private Integer meterStop;
    private String timestamp;
    private String reason;
    private List<TransactionData> transactionData;
}
