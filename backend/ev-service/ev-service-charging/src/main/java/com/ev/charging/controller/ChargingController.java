package com.ev.charging.controller;

import com.ev.charging.dto.ChargingSessionVO;
import com.ev.charging.dto.StartChargingReq;
import com.ev.charging.service.ChargingService;
import com.ev.common.core.exception.BizException;
import com.ev.common.core.result.R;
import com.ev.common.core.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@Tag(name = "充电控制") @RestController @RequiredArgsConstructor
public class ChargingController {

    private final ChargingService chargingService;

    /**
     * Z-015 fix: 始终从 JWT token 获取 userId，忽略请求体中的 userId
     */
    @Operation(summary = "启动充电") @PostMapping("/api/v1/charging/start")
    public R<ChargingSessionVO> start(@Valid @RequestBody StartChargingReq req) {
        Long userId = SecurityUtils.getUserId();
        if (userId == null) {
            throw BizException.notLogin();
        }
        return R.ok(chargingService.start(req, userId));
    }

    /**
     * Z-015 fix: 始终从 JWT token 获取 userId
     */
    @Operation(summary = "停止充电") @PostMapping("/api/v1/charging/{orderId}/stop")
    public R<ChargingSessionVO> stop(@PathVariable String orderId) {
        Long userId = SecurityUtils.getUserId();
        if (userId == null) {
            throw BizException.notLogin();
        }
        return R.ok(chargingService.stop(orderId, userId));
    }

    @Operation(summary = "充电状态") @GetMapping("/api/v1/charging/{orderId}/status")
    public R<ChargingSessionVO> status(@PathVariable String orderId) {
        return R.ok(chargingService.status(orderId));
    }
}
