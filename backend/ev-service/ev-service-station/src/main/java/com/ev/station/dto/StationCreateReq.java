package com.ev.station.dto;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class StationCreateReq {
    @NotBlank(message = "站点编码不能为空") private String code;
    @NotBlank(message = "站点名称不能为空") @Size(max = 128) private String name;
    private String type;
    @NotBlank(message = "省份不能为空") private String province;
    @NotBlank(message = "城市不能为空") private String city;
    private String district;
    @NotBlank(message = "地址不能为空") private String address;
    @NotNull(message = "经度不能为空") @DecimalMin("73.0") @DecimalMax("135.0") private BigDecimal longitude;
    @NotNull(message = "纬度不能为空") @DecimalMin("3.0") @DecimalMax("53.0") private BigDecimal latitude;
    private String contactName;
    @Pattern(regexp = "^1[3-9]\\d{9}$", message = "手机号格式不正确") private String contactPhone;
    private BigDecimal electricityPrice; private BigDecimal servicePrice; private BigDecimal parkingPrice;
    private Integer totalPorts;
}
