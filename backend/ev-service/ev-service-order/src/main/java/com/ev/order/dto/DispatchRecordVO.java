package com.ev.order.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class DispatchRecordVO {
    private String id;
    private String ruleId;
    private String ruleName;
    private String targetType;
    private String targetId;
    private String targetTitle;
    private String assignee;
    private String status;
    private String remark;
    private LocalDateTime createTime;
}
