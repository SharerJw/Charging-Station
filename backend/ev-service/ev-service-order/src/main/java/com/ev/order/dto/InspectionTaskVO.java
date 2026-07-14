package com.ev.order.dto;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data @Builder
public class InspectionTaskVO {
    private String id; private String name; private String stationName;
    private Integer deviceCount; private Integer itemCount;
    private String status; private String inspector;
    private LocalDateTime planTime; private LocalDateTime startTime; private LocalDateTime completeTime;
}
