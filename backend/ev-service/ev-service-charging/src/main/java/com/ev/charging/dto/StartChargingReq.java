package com.ev.charging.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class StartChargingReq {
    @NotBlank(message = "站点ID不能为空")
    private String stationId;
    @NotBlank(message = "设备编码不能为空")
    private String deviceCode;
    @NotBlank(message = "充电枪ID不能为空")
    private String connectorId;
}
