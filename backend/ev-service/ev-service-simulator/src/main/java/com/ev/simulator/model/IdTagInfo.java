package com.ev.simulator.model;

import lombok.Data;

@Data
public class IdTagInfo {
    private String status;
    private String expiryDate;
    private String parentIdTag;
}
