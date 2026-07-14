package com.ev.order.dto;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data @Builder
public class OrderVO {
    private String id; private String orderNo;
    private String stationId; private String stationName;
    private String deviceId; private String deviceCode; private Integer connectorId;
    private String userId; private String userNickname; private String status;
    private Long meterStart; private Long meterStop; private Long energyWh;
    private Integer peakPower; private Integer avgPower; private Integer startSoc; private Integer stopSoc;
    private Long electricityFee; private Long serviceFee; private Long parkingFee;
    private Long discountAmount; private Long totalAmount;
    private String payMethod; private LocalDateTime payTime;
    private LocalDateTime startTime; private LocalDateTime stopTime; private LocalDateTime createTime;
}
