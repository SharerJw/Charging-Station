package com.ev.order.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ev.common.core.result.R;
import com.ev.order.entity.DeviceAlertEntity;
import com.ev.order.dto.AlertVO;
import com.ev.order.mapper.DeviceAlertMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Tag(name = "运维端-告警") @RestController @RequestMapping("/api/v1/ops/alerts") @RequiredArgsConstructor
public class AlertController {
    private final DeviceAlertMapper alertMapper;

    @Operation(summary = "告警列表") @GetMapping
    public R<List<AlertVO>> list(@RequestParam(required = false) String level,
                                  @RequestParam(required = false) String status) {
        LambdaQueryWrapper<DeviceAlertEntity> wrapper = new LambdaQueryWrapper<>();
        if (level != null && !level.isBlank()) wrapper.eq(DeviceAlertEntity::getLevel, level);
        if (status != null && !status.isBlank()) wrapper.eq(DeviceAlertEntity::getStatus, status);
        wrapper.orderByDesc(DeviceAlertEntity::getCreatedAt);
        List<AlertVO> voList = alertMapper.selectList(wrapper).stream()
                .map(a -> AlertVO.builder()
                        .id(String.valueOf(a.getId())).level(a.getLevel()).title(a.getTitle())
                        .description(a.getDescription()).stationName(a.getStationName())
                        .deviceCode(a.getDeviceCode()).status(a.getStatus())
                        .handler(a.getHandler()).handleResult(a.getHandleResult())
                        .handleTime(a.getHandleTime()).createTime(a.getCreatedAt())
                        .build()).collect(Collectors.toList());
        return R.ok(voList);
    }

    @Operation(summary = "处理告警") @PostMapping("/{id}/handle")
    public R<AlertVO> handle(@PathVariable Long id, @RequestBody Map<String, String> body) {
        DeviceAlertEntity alert = alertMapper.selectById(id);
        if (alert == null) return R.fail(2001, "告警不存在");
        alert.setStatus("resolved");
        alert.setHandler(body.getOrDefault("handler", "运维工程师"));
        alert.setHandleResult(body.getOrDefault("result", "已处理"));
        alert.setHandleTime(LocalDateTime.now());
        alertMapper.updateById(alert);
        return R.ok(AlertVO.builder()
                .id(String.valueOf(alert.getId())).level(alert.getLevel()).title(alert.getTitle())
                .status(alert.getStatus()).handler(alert.getHandler())
                .handleResult(alert.getHandleResult()).handleTime(alert.getHandleTime())
                .build());
    }

    @Operation(summary = "忽略告警") @PostMapping("/{id}/ignore")
    public R<Void> ignore(@PathVariable Long id) {
        DeviceAlertEntity alert = alertMapper.selectById(id);
        if (alert == null) return R.fail(2001, "告警不存在");
        alert.setStatus("ignored");
        alertMapper.updateById(alert);
        return R.ok();
    }
}
