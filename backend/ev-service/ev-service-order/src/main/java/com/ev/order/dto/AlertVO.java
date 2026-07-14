package com.ev.order.dto;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data @Builder
public class AlertVO {
    private String id; private String level; private String title; private String description;
    private String stationName; private String deviceCode;
    private String status; private String handler; private String handleResult;
    private LocalDateTime handleTime; private LocalDateTime createTime;
}
