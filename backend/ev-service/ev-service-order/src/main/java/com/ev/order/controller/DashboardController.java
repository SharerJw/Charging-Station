package com.ev.order.controller;

import com.ev.common.core.result.R;
import com.ev.order.dto.*;
import com.ev.order.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@Tag(name = "仪表盘") @RestController @RequestMapping("/api/dashboard") @RequiredArgsConstructor
public class DashboardController {
    private final DashboardService dashboardService;

    /**
     * 统计概览 - 缓存 30 秒
     * 仪表盘数据不需要实时性，30 秒缓存可以显著减少数据库查询
     */
    @Operation(summary = "统计概览")
    @GetMapping("/overview")
    @Cacheable(value = "dashboard:stats", key = "'overview'", unless = "#result.code != 0")
    public R<DashboardStatsVO> overview() {
        return R.ok(dashboardService.stats());
    }

    /**
     * 趋势数据 - 缓存 60 秒
     * 趋势数据变化较慢，可以缓存更长时间
     */
    @Operation(summary = "趋势数据")
    @GetMapping("/trend")
    @Cacheable(value = "dashboard:chart", key = "#days ?: 7", unless = "#result.code != 0")
    public R<ChartDataVO> trend(@RequestParam(required = false) Integer days) {
        return R.ok(dashboardService.chart(days));
    }

    /**
     * 最近订单 - 缓存 15 秒
     * 最近订单需要相对实时
     */
    @Operation(summary = "最近订单")
    @GetMapping("/recent-orders")
    @Cacheable(value = "dashboard:recent-orders", key = "#limit ?: 5", unless = "#result.code != 0")
    public R<List<OrderVO>> recentOrders(@RequestParam(required = false) Integer limit) {
        return R.ok(dashboardService.recentOrders(limit));
    }

    @Operation(summary = "最近告警")
    @GetMapping("/alerts")
    public R<List<AlertVO>> alerts(@RequestParam(required = false) Integer limit) {
        return R.ok(dashboardService.alerts(limit));
    }

    /**
     * 待办事项统计 - 缓存 30 秒
     */
    @Operation(summary = "待办事项统计")
    @GetMapping("/todo-counts")
    @Cacheable(value = "dashboard:todo", key = "'counts'", unless = "#result.code != 0")
    public R<TodoCountsVO> todoCounts() {
        return R.ok(dashboardService.todoCounts());
    }

    /**
     * 站点排行 - 缓存 60 秒
     */
    @Operation(summary = "站点排行")
    @GetMapping("/station-rank")
    @Cacheable(value = "dashboard:station-rank", key = "(#limit ?: 5) + ':' + (#sortBy ?: 'revenue')", unless = "#result.code != 0")
    public R<List<StationRankVO>> stationRank(
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) String sortBy) {
        return R.ok(dashboardService.stationRank(limit, sortBy));
    }

    /**
     * 清除仪表盘缓存（供内部调用）
     */
    @CacheEvict(value = {"dashboard:stats", "dashboard:chart", "dashboard:recent-orders",
                          "dashboard:todo", "dashboard:station-rank"}, allEntries = true)
    public void evictDashboardCache() {
        // 缓存清除方法，由其他服务在数据变更时调用
    }
}
