package com.ev.simulator.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "启动充电模拟请求")
public class ChargingStartRequest {

    @NotBlank(message = "充电点编码不能为空")
    @Schema(description = "充电点编码", example = "CP001")
    private String chargePointId;

    @NotNull(message = "连接器编号不能为空")
    @Min(value = 1, message = "连接器编号最小为1")
    @Schema(description = "连接器编号", example = "1")
    private Integer connectorId;

    @NotBlank(message = "用户标签不能为空")
    @Schema(description = "用户标签", example = "USER001")
    private String idTag;

    @Min(value = 0, message = "目标SOC最小为0")
    @Max(value = 100, message = "目标SOC最大为100")
    @Schema(description = "目标SOC百分比", example = "80")
    private Integer targetSoc;
}
