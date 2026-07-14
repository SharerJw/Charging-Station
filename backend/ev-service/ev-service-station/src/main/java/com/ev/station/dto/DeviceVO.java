package com.ev.station.dto;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder
public class DeviceVO {
    private String id; private String stationId; private String code; private String ocppId;
    private String name; private String type; private String model; private String vendor;
    private Integer ratedPower; private String firmwareVersion;
    private String status; private String lifecycle;
    private List<ConnectorVO> connectors;
    private LocalDateTime createTime;
}
