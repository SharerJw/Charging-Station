package com.ev.order.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class DispatchRuleVO {
    private String id;
    private String name;
    private String description;
    private String ruleType;
    private String priority;
    private String conditions;
    private String assigneePattern;
    private Boolean enabled;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
