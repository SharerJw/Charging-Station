package com.ev.simulator.model;

import lombok.Data;

@Data
public class SampledValue {
    private String value;
    private String context;
    private String format;
    private String measurand;
    private String phase;
    private String location;
    private String unit;
}
