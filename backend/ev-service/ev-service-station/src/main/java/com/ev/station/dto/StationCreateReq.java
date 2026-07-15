package com.ev.station.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

/**
 * 创建/编辑充电站请求DTO
 *
 * Z-012 fix: @JsonIgnoreProperties 阻止通过请求体覆盖管理员字段
 */
@Data
@JsonIgnoreProperties({"totalPorts", "availablePorts", "id", "tenantId"})
public class StationCreateReq {
    @NotBlank(message = "站点编码不能为空")
    @Size(max = 64, message = "站点编码最长64字符")
    private String code;

    @NotBlank(message = "站点名称不能为空")
    @Size(max = 128, message = "站点名称最长128字符")
    private String name;

    private String type;

    @NotBlank(message = "省份不能为空") private String province;
    @NotBlank(message = "城市不能为空") private String city;
    private String district;

    @NotBlank(message = "地址不能为空")
    @Size(max = 256, message = "地址最长256字符")
    private String address;

    @NotNull(message = "经度不能为空") @DecimalMin("73.0") @DecimalMax("135.0")
    private BigDecimal longitude;

    @NotNull(message = "纬度不能为空") @DecimalMin("3.0") @DecimalMax("53.0")
    private BigDecimal latitude;

    @Size(max = 64, message = "联系人姓名最长64字符")
    private String contactName;

    @Pattern(regexp = "^1[3-9]\\d{9}$", message = "手机号格式不正确")
    private String contactPhone;

    /** D-008 fix: @Min(0) 阻止负价格 */
    @DecimalMin(value = "0", message = "电价不能为负数")
    private BigDecimal electricityPrice;

    @DecimalMin(value = "0", message = "服务费不能为负数")
    private BigDecimal servicePrice;

    @DecimalMin(value = "0", message = "停车费不能为负数")
    private BigDecimal parkingPrice;
}
