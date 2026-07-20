package com.ev.simulator.model;

import lombok.Data;
import java.util.List;

@Data
public class MeterValue {
    private String timestamp;
    private List<SampledValue> sampledValue;
}
