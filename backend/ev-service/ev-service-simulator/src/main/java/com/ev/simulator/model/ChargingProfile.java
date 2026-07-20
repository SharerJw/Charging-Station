package com.ev.simulator.model;

import lombok.Data;

@Data
public class ChargingProfile {
    private Integer chargingProfileId;
    private Integer stackLevel;
    private String chargingProfilePurpose;
    private String chargingProfileKind;
    private String chargingRateUnit;
}
