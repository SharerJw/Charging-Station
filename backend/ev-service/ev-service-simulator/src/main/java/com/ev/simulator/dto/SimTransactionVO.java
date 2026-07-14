package com.ev.simulator.dto;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SimTransactionVO {
    private String id; private Integer transactionId; private String chargePointId;
    private Integer connectorId; private String idTag; private String status;
    private String startTimestamp; private String stopTimestamp;
    private Long meterStart; private Long meterStop;
    private Long energy; private Long power; private Integer soc;
    private Long voltage; private Long current;
}
