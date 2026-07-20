package com.ev.charging.controller;

import com.ev.charging.dto.ChargingSessionVO;
import com.ev.charging.dto.ChargingStatsVO;
import com.ev.charging.dto.StartChargingReq;
import com.ev.charging.service.ChargingService;
import com.ev.common.core.exception.BizException;
import com.ev.common.core.result.PageResult;
import com.ev.common.core.result.R;
import com.ev.common.core.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

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

    // ==================== 新增查询、统计和历史记录接口 ====================

    @Operation(summary = "充电会话分页列表") @GetMapping("/api/v1/charging/sessions")
    public R<PageResult<ChargingSessionVO>> listSessions(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long stationId,
            @RequestParam(required = false) Long userId) {
        return R.ok(chargingService.listSessions(page, size, status, stationId, userId));
    }

    @Operation(summary = "充电会话详情") @GetMapping("/api/v1/charging/sessions/{sessionId}")
    public R<ChargingSessionVO> getSessionDetail(@PathVariable String sessionId) {
        return R.ok(chargingService.getSessionDetail(sessionId));
    }

    @Operation(summary = "充电统计") @GetMapping("/api/v1/charging/stats")
    public R<ChargingStatsVO> getStats(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) Long stationId) {
        return R.ok(chargingService.getStats(startDate, endDate, stationId));
    }

    @Operation(summary = "用户充电历史") @GetMapping("/api/v1/charging/history/{userId}")
    public R<PageResult<ChargingSessionVO>> getUserHistory(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return R.ok(chargingService.getUserHistory(userId, page, size));
    }
}
