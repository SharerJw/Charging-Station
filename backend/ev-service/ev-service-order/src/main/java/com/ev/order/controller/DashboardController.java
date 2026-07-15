package com.ev.order.controller;

import com.ev.common.core.result.R;
import com.ev.order.dto.*;
import com.ev.order.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@Tag(name = "仪表盘") @RestController @RequestMapping("/api/dashboard") @RequiredArgsConstructor
public class DashboardController {
    private final DashboardService dashboardService;

    @Operation(summary = "统计概览") @GetMapping("/overview")
    public R<DashboardStatsVO> overview() { return R.ok(dashboardService.stats()); }

    @Operation(summary = "趋势数据") @GetMapping("/trend")
    public R<ChartDataVO> trend(@RequestParam(required = false) Integer days) { return R.ok(dashboardService.chart(days)); }

    @Operation(summary = "最近订单") @GetMapping("/recent-orders")
    public R<List<OrderVO>> recentOrders(@RequestParam(required = false) Integer limit) { return R.ok(dashboardService.recentOrders(limit)); }

    @Operation(summary = "最近告警") @GetMapping("/alerts")
    public R<List<AlertVO>> alerts(@RequestParam(required = false) Integer limit) { return R.ok(dashboardService.alerts(limit)); }

    @Operation(summary = "站点排行") @GetMapping("/station-rank")
    public R<List<StationRankVO>> stationRank(
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) String sortBy) {
        return R.ok(dashboardService.stationRank(limit, sortBy));
    }
}
