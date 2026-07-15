package com.ev.simulator.controller;

import com.ev.common.core.result.R;
import com.ev.simulator.dto.SimStatsVO;
import com.ev.simulator.engine.ChargingSimulator;
import com.ev.simulator.service.SimulatorDeviceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.Map;

@Tag(name = "模拟器-统计") @RestController @RequestMapping("/api/simulator") @RequiredArgsConstructor
public class StatsController {
    private final SimulatorDeviceService deviceService;
    private final ChargingSimulator chargingSimulator;

    @Operation(summary = "统计概览") @GetMapping("/stats")
    public R<SimStatsVO> stats() {
        var devices = deviceService.listAll();
        long online = devices.stream().filter(d -> "online".equals(d.getStatus())).count();
        long charging = chargingSimulator.getAllTransactions().size();
        return R.ok(SimStatsVO.builder()
                .totalDevices(devices.size()).onlineDevices((int) online)
                .chargingDevices((int) charging).faultDevices(1)
                .totalEnergy(45680L).totalTransactions(128)
                .averageChargingTime(45).peakPower(240000L)
                .build());
    }

    @Operation(summary = "实时统计") @GetMapping("/stats/realtime")
    public R<Map<String, Object>> realtime() {
        var devices = deviceService.listAll();
        long online = devices.stream().filter(d -> "online".equals(d.getStatus())).count();
        long offline = devices.stream().filter(d -> "offline".equals(d.getStatus())).count();
        long charging = chargingSimulator.getAllTransactions().size();
        return R.ok(Map.of(
                "totalDevices", devices.size(),
                "onlineDevices", online,
                "offlineDevices", offline,
                "chargingDevices", charging,
                "timestamp", Instant.now().toString()
        ));
    }

    @Operation(summary = "健康检查") @GetMapping("/health")
    public R<Map<String, Object>> health() {
        return R.ok(Map.of("status", "UP", "devices", deviceService.listAll().size(), "uptime", "99.9%"));
    }
}
