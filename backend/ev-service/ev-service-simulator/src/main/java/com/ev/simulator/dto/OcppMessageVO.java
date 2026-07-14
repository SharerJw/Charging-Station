package com.ev.simulator.dto;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class OcppMessageVO {
    private String messageId; private String action;
    private String type; // Call/CallResult/CallError
    private Object payload; private String timestamp;
    private String direction; // inbound/outbound
    private String chargePointId;
}
