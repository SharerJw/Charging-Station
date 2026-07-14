package com.ev.simulator.service.impl;

import com.ev.simulator.dto.ScenarioVO;
import com.ev.simulator.service.ScenarioService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class ScenarioServiceImpl implements ScenarioService {

    private final Map<String, ScenarioVO> scenarios = new ConcurrentHashMap<>();

    public ScenarioServiceImpl() {
        scenarios.put("SC001", ScenarioVO.builder()
                .id("SC001").name("正常充电流程测试").description("模拟完整充电流程：启动→充电→停止")
                .status("idle").deviceCount(3).stepCount(5).createdAt(Instant.now().toString()).build());
        scenarios.put("SC002", ScenarioVO.builder()
                .id("SC002").name("高并发压力测试").description("模拟8台设备同时充电")
                .status("idle").deviceCount(8).stepCount(10).createdAt(Instant.now().toString()).build());
        scenarios.put("SC003", ScenarioVO.builder()
                .id("SC003").name("故障注入测试").description("模拟充电过程中设备故障")
                .status("idle").deviceCount(2).stepCount(8).createdAt(Instant.now().toString()).build());
    }

    @Override
    public List<ScenarioVO> list() { return new ArrayList<>(scenarios.values()); }

    @Override
    public ScenarioVO create(ScenarioVO scenario) {
        scenario.setId("SC" + (scenarios.size() + 1));
        scenario.setStatus("idle");
        scenario.setCreatedAt(Instant.now().toString());
        scenarios.put(scenario.getId(), scenario);
        return scenario;
    }

    @Override
    public void execute(String id) {
        ScenarioVO sc = scenarios.get(id);
        if (sc != null) {
            sc.setStatus("running");
            sc.setStartedAt(Instant.now().toString());
            log.info("执行场景: id={}, name={}", id, sc.getName());
        }
    }

    @Override
    public void stop(String id) {
        ScenarioVO sc = scenarios.get(id);
        if (sc != null) {
            sc.setStatus("completed");
            sc.setCompletedAt(Instant.now().toString());
        }
    }
}
