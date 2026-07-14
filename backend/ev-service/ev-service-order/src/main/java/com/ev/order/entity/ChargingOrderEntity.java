package com.ev.order.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.ev.common.mybatis.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.time.LocalDateTime;

@Data @EqualsAndHashCode(callSuper = true) @TableName("charging_order")
public class ChargingOrderEntity extends BaseEntity {
    private String orderNo; private Long stationId; private String stationName;
    private Long deviceId; private String deviceCode; private Integer connectorId;
    private Long userId; private String userNickname; private String status;
    private Long meterStart; private Long meterStop; private Long energyWh;
    private Integer peakPower; private Integer avgPower; private Integer startSoc; private Integer stopSoc;
    private Long electricityFee; private Long serviceFee; private Long parkingFee;
    private Long discountAmount; private Long totalAmount;
    private String payMethod; private LocalDateTime payTime;
    private LocalDateTime startTime; private LocalDateTime stopTime; private LocalDateTime settleTime;
}
