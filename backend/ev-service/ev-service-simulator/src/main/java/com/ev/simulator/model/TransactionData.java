package com.ev.simulator.model;

import lombok.Data;
import java.util.List;

@Data
public class TransactionData {
    private String timestamp;
    private List<SampledValue> sampledValue;
}
