package com.ev.simulator.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "更新设备状态请求")
public class DeviceStatusUpdateRequest {

    @NotBlank(message = "设备状态不能为空")
    @Schema(description = "设备状态", example = "online")
    private String status;
}
