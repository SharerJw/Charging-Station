package com.ev.station.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ev.common.core.result.R;
import com.ev.station.entity.DeviceEntity;
import com.ev.station.entity.StationEntity;
import com.ev.station.mapper.DeviceMapper;
import com.ev.station.mapper.StationMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * 内部统计接口 — 供其他微服务调用
 */
@Tag(name = "内部统计")
@RestController
@RequiredArgsConstructor
public class InternalStatsController {
    private final StationMapper stationMapper;
    private final DeviceMapper deviceMapper;

    @Operation(summary = "站点/设备统计")
    @GetMapping("/internal/stats")
    public R<Map<String, Integer>> stats() {
        // 站点总数（排除已删除）
        int stationCount = stationMapper.selectCount(
                new LambdaQueryWrapper<StationEntity>()
                        .ne(StationEntity::getStatus, "DELETED")).intValue();

        // 设备总数
        int deviceCount = deviceMapper.selectCount(new LambdaQueryWrapper<>()).intValue();

        // 在线设备数
        int onlineDeviceCount = deviceMapper.selectCount(
                new LambdaQueryWrapper<DeviceEntity>()
                        .in(DeviceEntity::getStatus, "ONLINE", "CHARGING")).intValue();

        Map<String, Integer> data = new HashMap<>();
        data.put("stationCount", stationCount);
        data.put("deviceCount", deviceCount);
        data.put("onlineDeviceCount", onlineDeviceCount);
        return R.ok(data);
    }
}
