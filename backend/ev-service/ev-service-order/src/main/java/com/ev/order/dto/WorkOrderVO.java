package com.ev.order.dto;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data @Builder
public class WorkOrderVO {
    private String id; private String orderNo; private String type; private String title; private String description;
    private String stationName; private String deviceCode;
    private String priority; private String status;
    private String creator; private String assignee; private String result;
    private LocalDateTime createTime; private LocalDateTime acceptTime; private LocalDateTime completeTime;
}
