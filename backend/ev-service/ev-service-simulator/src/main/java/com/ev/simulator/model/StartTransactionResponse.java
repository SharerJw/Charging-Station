package com.ev.simulator.model;

import lombok.Data;

@Data
public class StartTransactionResponse {
    private Integer transactionId;
    private IdTagInfo idTagInfo;
}
