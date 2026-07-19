package com.ev.station.dto;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Builder
public class StationVO {
    private String id; private String code; private String name; private String type; private String status;
    private String province; private String city; private String district; private String address;
    private BigDecimal longitude; private BigDecimal latitude;
    private String contactName; private String contactPhone;
    private BigDecimal electricityPrice; private BigDecimal servicePrice; private BigDecimal parkingPrice;
    private Integer totalPorts; private Integer availablePorts;
    private Integer deviceCount; private Integer onlineDeviceCount;
    private Integer todayOrderCount; private Long todayRevenue;
    private LocalDateTime createTime;
    private Double distance; // 单位：米，由后端 Haversine 公式计算
}
