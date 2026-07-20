package com.ev.simulator.dto;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ScenarioVO {
    private String id; private String name; private String description;
    private String status; // idle/running/completed/failed
    private Integer deviceCount; private Integer stepCount;
    private String createdAt; private String startedAt; private String completedAt;
    private List<String> deviceIds;
    private List<Map<String, Object>> steps;
}
