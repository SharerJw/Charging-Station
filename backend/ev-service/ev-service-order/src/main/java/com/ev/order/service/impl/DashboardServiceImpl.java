package com.ev.order.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.ev.order.dto.*;
import com.ev.order.entity.ChargingOrderEntity;
import com.ev.order.entity.DeviceAlertEntity;
import com.ev.order.mapper.ChargingOrderMapper;
import com.ev.order.mapper.DeviceAlertMapper;
import com.ev.order.service.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {
    private final ChargingOrderMapper orderMapper;
    private final DeviceAlertMapper alertMapper;

    @Override
    public DashboardStatsVO stats() {
        LocalDateTime todayStart = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime monthStart = LocalDateTime.of(LocalDate.now().withDayOfMonth(1), LocalTime.MIN);

        // 使用 SQL 聚合查询，避免加载全部订单到内存
        // 今日统计
        Map<String, Object> todayStats = orderMapper.selectMaps(
            new QueryWrapper<ChargingOrderEntity>()
                .select("COUNT(*) AS order_count",
                        "COALESCE(SUM(total_amount), 0) AS total_revenue",
                        "COALESCE(SUM(energy_wh), 0) AS total_energy")
                .ge("created_at", todayStart)
        ).get(0);

        int todayOrderCount = getInt(todayStats, "order_count");
        long todayRevenue = getLong(todayStats, "total_revenue");
        long todayEnergy = getLong(todayStats, "total_energy");

        // 本月统计
        Map<String, Object> monthStats = orderMapper.selectMaps(
            new QueryWrapper<ChargingOrderEntity>()
                .select("COALESCE(SUM(total_amount), 0) AS total_revenue")
                .ge("created_at", monthStart)
        ).get(0);
        long monthRevenue = getLong(monthStats, "total_revenue");

        // 总电量
        Map<String, Object> totalStats = orderMapper.selectMaps(
            new QueryWrapper<ChargingOrderEntity>()
                .select("COALESCE(SUM(energy_wh), 0) AS total_energy")
        ).get(0);
        long totalEnergy = getLong(totalStats, "total_energy");

        // 从station-service获取站点和设备统计
        int[] stationDeviceCounts = fetchStationDeviceCounts();

        // 计算趋势数据
        Map<String, TrendDTO> trends = calculateTrendsOptimized(
            todayEnergy, todayRevenue, todayOrderCount, stationDeviceCounts);

        return DashboardStatsVO.builder()
                .stationCount(stationDeviceCounts[0])
                .deviceCount(stationDeviceCounts[1])
                .onlineDeviceCount(stationDeviceCounts[2])
                .todayOrderCount(todayOrderCount)
                .todayRevenue(todayRevenue)
                .monthRevenue(monthRevenue)
                .totalEnergy(totalEnergy)
                .todayEnergy(todayEnergy)
                .trends(trends)
                .build();
    }

    /**
     * 计算趋势百分比
     * @param current 当前值
     * @param previous 对比值
     * @return 百分比变化，保留一位小数
     */
    private double calcPercent(long current, long previous) {
        if (previous == 0) return current > 0 ? 100.0 : 0.0;
        return Math.round((current - previous) * 1000.0 / previous) / 10.0;
    }

    /**
     * 获取指定日期的订单列表
     */
    private List<ChargingOrderEntity> getOrdersByDate(LocalDate date) {
        LocalDateTime dayStart = LocalDateTime.of(date, LocalTime.MIN);
        LocalDateTime dayEnd = LocalDateTime.of(date, LocalTime.MAX);
        return orderMapper.selectList(
            new LambdaQueryWrapper<ChargingOrderEntity>()
                .ge(ChargingOrderEntity::getCreatedAt, dayStart)
                .le(ChargingOrderEntity::getCreatedAt, dayEnd));
    }

    /**
     * 计算趋势数据
     */
    private Map<String, TrendDTO> calculateTrends(long todayEnergy, long todayRevenue,
                                                   int todayOrderCount, int[] stationDeviceCounts) {
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);
        LocalDate lastWeek = today.minusWeeks(1);

        // 昨日数据
        List<ChargingOrderEntity> yesterdayOrders = getOrdersByDate(yesterday);
        long yesterdayEnergy = yesterdayOrders.stream()
            .mapToLong(o -> o.getEnergyWh() != null ? o.getEnergyWh() : 0).sum();
        long yesterdayRevenue = yesterdayOrders.stream()
            .mapToLong(o -> o.getTotalAmount() != null ? o.getTotalAmount() : 0).sum();
        int yesterdayOrderCount = yesterdayOrders.size();

        // 上周同日数据
        List<ChargingOrderEntity> lastWeekOrders = getOrdersByDate(lastWeek);
        long lastWeekEnergy = lastWeekOrders.stream()
            .mapToLong(o -> o.getEnergyWh() != null ? o.getEnergyWh() : 0).sum();
        long lastWeekRevenue = lastWeekOrders.stream()
            .mapToLong(o -> o.getTotalAmount() != null ? o.getTotalAmount() : 0).sum();
        int lastWeekOrderCount = lastWeekOrders.size();

        Map<String, TrendDTO> trends = new HashMap<>();
        trends.put("todayEnergy", new TrendDTO(
            calcPercent(todayEnergy, yesterdayEnergy),
            calcPercent(todayEnergy, lastWeekEnergy)));
        trends.put("todayRevenue", new TrendDTO(
            calcPercent(todayRevenue, yesterdayRevenue),
            calcPercent(todayRevenue, lastWeekRevenue)));
        trends.put("todayOrderCount", new TrendDTO(
            calcPercent(todayOrderCount, yesterdayOrderCount),
            calcPercent(todayOrderCount, lastWeekOrderCount)));
        trends.put("stationCount", new TrendDTO(0.0, 0.0));
        trends.put("onlineDeviceRate", new TrendDTO(0.0, 0.0));
        trends.put("totalEnergy", new TrendDTO(0.0, 0.0));

        return trends;
    }

    /**
     * 通过HTTP调用station-service获取站点/设备统计
     * 返回 [stationCount, deviceCount, onlineDeviceCount]
     */
    private int[] fetchStationDeviceCounts() {
        try {
            RestTemplate restTemplate = new RestTemplate();
            Map resp = restTemplate.getForObject(
                    "http://localhost:8082/internal/stats", Map.class);
            if (resp != null && resp.containsKey("data")) {
                Map data = (Map) resp.get("data");
                return new int[]{
                        getInt(data, "stationCount"),
                        getInt(data, "deviceCount"),
                        getInt(data, "onlineDeviceCount")
                };
            }
        } catch (Exception e) {
            log.warn("获取站点统计失败，使用默认值: {}", e.getMessage());
        }
        return new int[]{0, 0, 0};
    }

    private int getInt(Map map, String key) {
        Object val = map.get(key);
        if (val instanceof Number) return ((Number) val).intValue();
        return 0;
    }

    private long getLong(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val instanceof Number) return ((Number) val).longValue();
        return 0L;
    }

    /**
     * 优化版趋势计算 - 使用 SQL 聚合
     */
    private Map<String, TrendDTO> calculateTrendsOptimized(long todayEnergy, long todayRevenue,
                                                            int todayOrderCount, int[] stationDeviceCounts) {
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);
        LocalDate lastWeek = today.minusWeeks(1);

        // 昨日统计
        LocalDateTime yesterdayStart = LocalDateTime.of(yesterday, LocalTime.MIN);
        LocalDateTime yesterdayEnd = LocalDateTime.of(yesterday, LocalTime.MAX);
        Map<String, Object> yesterdayStats = orderMapper.selectMaps(
            new QueryWrapper<ChargingOrderEntity>()
                .select("COUNT(*) AS order_count",
                        "COALESCE(SUM(total_amount), 0) AS total_revenue",
                        "COALESCE(SUM(energy_wh), 0) AS total_energy")
                .ge("created_at", yesterdayStart)
                .le("created_at", yesterdayEnd)
        ).get(0);
        long yesterdayEnergy = getLong(yesterdayStats, "total_energy");
        long yesterdayRevenue = getLong(yesterdayStats, "total_revenue");
        int yesterdayOrderCount = getInt(yesterdayStats, "order_count");

        // 上周同日统计
        LocalDateTime lastWeekStart = LocalDateTime.of(lastWeek, LocalTime.MIN);
        LocalDateTime lastWeekEnd = LocalDateTime.of(lastWeek, LocalTime.MAX);
        Map<String, Object> lastWeekStats = orderMapper.selectMaps(
            new QueryWrapper<ChargingOrderEntity>()
                .select("COUNT(*) AS order_count",
                        "COALESCE(SUM(total_amount), 0) AS total_revenue",
                        "COALESCE(SUM(energy_wh), 0) AS total_energy")
                .ge("created_at", lastWeekStart)
                .le("created_at", lastWeekEnd)
        ).get(0);
        long lastWeekEnergy = getLong(lastWeekStats, "total_energy");
        long lastWeekRevenue = getLong(lastWeekStats, "total_revenue");
        int lastWeekOrderCount = getInt(lastWeekStats, "order_count");

        Map<String, TrendDTO> trends = new HashMap<>();
        trends.put("todayEnergy", new TrendDTO(
            calcPercent(todayEnergy, yesterdayEnergy),
            calcPercent(todayEnergy, lastWeekEnergy)));
        trends.put("todayRevenue", new TrendDTO(
            calcPercent(todayRevenue, yesterdayRevenue),
            calcPercent(todayRevenue, lastWeekRevenue)));
        trends.put("todayOrderCount", new TrendDTO(
            calcPercent(todayOrderCount, yesterdayOrderCount),
            calcPercent(todayOrderCount, lastWeekOrderCount)));
        trends.put("stationCount", new TrendDTO(0.0, 0.0));
        trends.put("onlineDeviceRate", new TrendDTO(0.0, 0.0));
        trends.put("totalEnergy", new TrendDTO(0.0, 0.0));

        return trends;
    }

    @Override
    public ChartDataVO chart(Integer days) {
        if (days == null) days = 7;

        // 使用 SQL GROUP BY 聚合，避免 N+1 查询
        LocalDate startDate = LocalDate.now().minusDays(days - 1);
        LocalDateTime startDateTime = LocalDateTime.of(startDate, LocalTime.MIN);

        // 按日期分组统计
        QueryWrapper<ChargingOrderEntity> wrapper = new QueryWrapper<>();
        wrapper.select(
                "DATE(created_at) AS stat_date",
                "COUNT(*) AS order_count",
                "COALESCE(SUM(total_amount), 0) AS total_revenue",
                "COALESCE(SUM(energy_wh), 0) AS total_energy");
        wrapper.ge("created_at", startDateTime);
        wrapper.groupBy("DATE(created_at)");
        wrapper.orderByAsc("stat_date");

        List<Map<String, Object>> rows = orderMapper.selectMaps(wrapper);

        // 构建日期到统计数据的映射
        Map<String, Map<String, Object>> statsMap = new HashMap<>();
        for (Map<String, Object> row : rows) {
            String dateStr = String.valueOf(row.get("stat_date"));
            statsMap.put(dateStr, row);
        }

        // 填充结果（包含没有订单的日期）
        List<String> dates = new ArrayList<>();
        List<Integer> orderCounts = new ArrayList<>();
        List<Long> revenues = new ArrayList<>();
        List<Long> energies = new ArrayList<>();

        for (int i = days - 1; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            String dateStr = date.toString();
            dates.add(date.getMonthValue() + "-" + String.format("%02d", date.getDayOfMonth()));

            Map<String, Object> stats = statsMap.get(dateStr);
            if (stats != null) {
                orderCounts.add(getInt(stats, "order_count"));
                revenues.add(getLong(stats, "total_revenue"));
                energies.add(getLong(stats, "total_energy"));
            } else {
                orderCounts.add(0);
                revenues.add(0L);
                energies.add(0L);
            }
        }

        return ChartDataVO.builder()
                .dates(dates).orderCounts(orderCounts)
                .revenues(revenues).energies(energies).build();
    }

    @Override
    public List<OrderVO> recentOrders(Integer limit) {
        if (limit == null) limit = 5;
        return orderMapper.selectList(new LambdaQueryWrapper<ChargingOrderEntity>()
                .orderByDesc(ChargingOrderEntity::getCreatedAt).last("LIMIT " + limit))
                .stream().map(this::toVO).collect(Collectors.toList());
    }

    @Override
    public List<AlertVO> alerts(Integer limit) {
        if (limit == null) limit = 5;
        return alertMapper.selectList(new LambdaQueryWrapper<DeviceAlertEntity>()
                .orderByDesc(DeviceAlertEntity::getCreatedAt).last("LIMIT " + limit))
                .stream().map(a -> AlertVO.builder()
                        .id(String.valueOf(a.getId())).level(a.getLevel()).title(a.getTitle())
                        .description(a.getDescription()).stationName(a.getStationName())
                        .deviceCode(a.getDeviceCode()).status(a.getStatus())
                        .handler(a.getHandler()).handleResult(a.getHandleResult())
                        .handleTime(a.getHandleTime()).createTime(a.getCreatedAt())
                        .build()).collect(Collectors.toList());
    }

    @Override
    public List<StationRankVO> stationRank(Integer limit, String sortBy) {
        if (limit == null) limit = 5;
        if (limit > 50) limit = 50;

        // Validate sortBy parameter - only allow known fields
        Set<String> allowedSortFields = Set.of("revenue", "orderCount", "energy");
        String sortByField = (sortBy != null && allowedSortFields.contains(sortBy)) ? sortBy : "revenue";

        // Determine ORDER BY SQL to avoid loading all orders into memory
        String orderBySql;
        switch (sortByField) {
            case "orderCount": orderBySql = "order_count DESC"; break;
            case "energy":     orderBySql = "COALESCE(SUM(energy_wh), 0) DESC"; break;
            default:           orderBySql = "COALESCE(SUM(total_amount), 0) DESC"; break;
        }

        // Use SQL GROUP BY aggregation instead of loading all rows into memory
        QueryWrapper<ChargingOrderEntity> wrapper = new QueryWrapper<>();
        wrapper.select(
                "station_id AS station_id",
                "MAX(station_name) AS station_name",
                "COALESCE(SUM(total_amount), 0) AS total_revenue",
                "COUNT(*) AS order_count",
                "COALESCE(SUM(energy_wh), 0) AS total_energy");
        wrapper.groupBy("station_id");
        wrapper.last("ORDER BY " + orderBySql + " LIMIT " + limit);

        List<Map<String, Object>> rows = orderMapper.selectMaps(wrapper);

        return rows.stream().map(row -> StationRankVO.builder()
                .stationId(row.get("station_id") != null ? String.valueOf(row.get("station_id")) : null)
                .stationName(row.get("station_name") != null ? String.valueOf(row.get("station_name")) : "")
                .revenue(row.get("total_revenue") != null ? ((Number) row.get("total_revenue")).longValue() : 0L)
                .orderCount(row.get("order_count") != null ? ((Number) row.get("order_count")).intValue() : 0)
                .energy(row.get("total_energy") != null ? ((Number) row.get("total_energy")).longValue() : 0L)
                .build())
            .collect(Collectors.toList());
    }

    @Override
    public TodoCountsVO todoCounts() {
        // 待处理告警
        Integer pendingAlerts = Math.toIntExact(alertMapper.selectCount(
            new LambdaQueryWrapper<DeviceAlertEntity>()
                .eq(DeviceAlertEntity::getStatus, "pending")));

        // 待结算订单（SETTLED 状态）
        Integer settledOrders = Math.toIntExact(orderMapper.selectCount(
            new LambdaQueryWrapper<ChargingOrderEntity>()
                .eq(ChargingOrderEntity::getStatus, "SETTLED")));

        // 退款中订单
        Integer refundingOrders = Math.toIntExact(orderMapper.selectCount(
            new LambdaQueryWrapper<ChargingOrderEntity>()
                .eq(ChargingOrderEntity::getStatus, "REFUNDING")));

        // 待办工单（需要调用运维服务，暂时返回 0）
        Integer pendingWorkOrders = 0;

        return TodoCountsVO.builder()
            .pendingAlerts(pendingAlerts)
            .pendingWorkOrders(pendingWorkOrders)
            .settledOrders(settledOrders)
            .refundingOrders(refundingOrders)
            .build();
    }

    private OrderVO toVO(ChargingOrderEntity e) {
        return OrderVO.builder()
                .id(String.valueOf(e.getId())).orderNo(e.getOrderNo())
                .stationName(e.getStationName()).deviceCode(e.getDeviceCode())
                .userNickname(e.getUserNickname()).status(e.getStatus())
                .energyWh(e.getEnergyWh()).totalAmount(e.getTotalAmount())
                .startTime(e.getStartTime()).stopTime(e.getStopTime()).createTime(e.getCreatedAt())
                .build();
    }
}
