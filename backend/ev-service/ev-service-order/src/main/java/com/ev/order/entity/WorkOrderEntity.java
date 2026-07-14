package com.ev.order.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.io.Serializable;
import java.time.LocalDateTime;

@Data @TableName("work_order")
public class WorkOrderEntity implements Serializable {
    @TableId(type = IdType.AUTO) private Long id;
    private String orderNo; private String type; private String title; private String description;
    private Long stationId; private String stationName;
    private Long deviceId; private String deviceCode;
    private String priority; private String status;
    private String creator; private String assignee; private String result;
    private String tenantId;
    private LocalDateTime createdAt; private LocalDateTime acceptTime; private LocalDateTime completeTime;
    private LocalDateTime updatedAt;
}
