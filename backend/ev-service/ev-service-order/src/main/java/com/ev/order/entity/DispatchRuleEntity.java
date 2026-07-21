package com.ev.order.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@TableName("dispatch_rule")
public class DispatchRuleEntity implements Serializable {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String description;
    private String ruleType;
    private String priority;
    private String conditions;
    private String assigneePattern;
    private Boolean enabled;
    private String tenantId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
