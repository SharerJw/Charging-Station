package com.ev.station.dto;
import lombok.Builder;
import lombok.Data;

@Data @Builder
public class ConnectorVO {
    private String id; private Integer connectorId; private String type;
    private String status; private Integer maxPower; private Long currentTransactionId;
}
