package com.ev.simulator.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "创建场景请求")
public class ScenarioCreateRequest {

    @NotBlank(message = "场景名称不能为空")
    @Schema(description = "场景名称", example = "压力测试场景")
    private String name;

    @Schema(description = "场景描述", example = "模拟100台设备同时充电")
    private String description;

    @Min(value = 1, message = "设备数量最小为1")
    @Max(value = 100, message = "设备数量最大为100")
    @Schema(description = "设备数量", example = "10")
    private Integer deviceCount;

    @Schema(description = "场景类型", example = "stress_test")
    private String scenarioType;
}
