package com.ev.order.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.io.Serializable;
import java.time.LocalDateTime;

@Data @TableName("inspection_task")
public class InspectionTaskEntity implements Serializable {
    @TableId(type = IdType.AUTO) private Long id;
    private String name; private Long stationId; private String stationName;
    private Integer deviceCount; private Integer itemCount;
    private String status; private String inspector;
    private String tenantId;
    private LocalDateTime planTime; private LocalDateTime startTime; private LocalDateTime completeTime;
    private LocalDateTime createdAt; private LocalDateTime updatedAt;
}
