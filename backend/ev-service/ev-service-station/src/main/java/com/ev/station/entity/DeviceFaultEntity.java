package com.ev.station.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.ev.common.mybatis.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data @EqualsAndHashCode(callSuper = true) @TableName("device_fault")
public class DeviceFaultEntity extends BaseEntity {
    private Long deviceId;
    private String deviceCode;
    private String faultCode;
    private String faultDescription;
    private String level;
    private String status;
    private LocalDateTime occurredAt;
    private LocalDateTime resolvedAt;
}
