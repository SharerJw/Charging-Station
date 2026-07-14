package com.ev.order.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.io.Serializable;
import java.time.LocalDateTime;

@Data @TableName("device_alert")
public class DeviceAlertEntity implements Serializable {
    @TableId(type = IdType.AUTO) private Long id;
    private Long deviceId; private String deviceCode;
    private Long stationId; private String stationName;
    private String level; private String title; private String description;
    private String status; private String handler; private String handleResult;
    private LocalDateTime handleTime; private String tenantId; private LocalDateTime createdAt;
}
