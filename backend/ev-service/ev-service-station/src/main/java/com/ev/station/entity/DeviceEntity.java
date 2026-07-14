package com.ev.station.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.ev.common.mybatis.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data @EqualsAndHashCode(callSuper = true) @TableName("device")
public class DeviceEntity extends BaseEntity {
    private Long stationId; private String code; private String ocppId; private String name;
    private String type; private String model; private String vendor;
    private Integer ratedPower; private String firmwareVersion;
    private String status; private String lifecycle;
}
