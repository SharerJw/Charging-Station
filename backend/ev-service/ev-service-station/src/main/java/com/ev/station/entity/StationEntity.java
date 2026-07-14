package com.ev.station.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.ev.common.mybatis.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.math.BigDecimal;

@Data @EqualsAndHashCode(callSuper = true) @TableName("station")
public class StationEntity extends BaseEntity {
    private String code; private String name; private String type; private String status;
    private String province; private String city; private String district; private String address;
    private BigDecimal longitude; private BigDecimal latitude;
    private String contactName; private String contactPhone;
    private BigDecimal electricityPrice; private BigDecimal servicePrice; private BigDecimal parkingPrice;
    private Integer totalPorts; private Integer availablePorts; private String orgId;
}
