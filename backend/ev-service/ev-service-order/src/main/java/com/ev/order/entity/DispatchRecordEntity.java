package com.ev.order.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@TableName("dispatch_record")
public class DispatchRecordEntity implements Serializable {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long ruleId;
    private String ruleName;
    private String targetType;
    private String targetId;
    private String targetTitle;
    private String assignee;
    private String status;
    private String remark;
    private String tenantId;
    private LocalDateTime createdAt;
}
