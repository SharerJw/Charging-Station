package com.ev.simulator.model;

import lombok.Data;
import java.util.List;

@Data
public class MeterValuesRequest {
    private Integer connectorId;
    private Integer transactionId;
    private List<MeterValue> meterValue;
}
