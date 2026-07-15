package com.ev.order.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
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

        // 今日订单列表
        List<ChargingOrderEntity> todayOrders = orderMapper.selectList(
                new LambdaQueryWrapper<ChargingOrderEntity>()
                        .ge(ChargingOrderEntity::getCreatedAt, todayStart));

        // 本月订单列表
        List<ChargingOrderEntity> monthOrders = orderMapper.selectList(
                new LambdaQueryWrapper<ChargingOrderEntity>()
                        .ge(ChargingOrderEntity::getCreatedAt, monthStart));

        // 今日营收（分）
        long todayRevenue = todayOrders.stream()
                .mapToLong(o -> o.getTotalAmount() != null ? o.getTotalAmount() : 0).sum();

        // 本月营收（分）
        long monthRevenue = monthOrders.stream()
                .mapToLong(o -> o.getTotalAmount() != null ? o.getTotalAmount() : 0).sum();

        // 今日电量（Wh）
        long todayEnergy = todayOrders.stream()
                .mapToLong(o -> o.getEnergyWh() != null ? o.getEnergyWh() : 0).sum();

        // 总电量（Wh）
        Long totalEnergy = orderMapper.selectList(new LambdaQueryWrapper<>())
                .stream().mapToLong(o -> o.getEnergyWh() != null ? o.getEnergyWh() : 0).sum();

        // 今日订单数
        int todayOrderCount = todayOrders.size();

        // 从station-service获取站点和设备统计
        int[] stationDeviceCounts = fetchStationDeviceCounts();

        return DashboardStatsVO.builder()
                .stationCount(stationDeviceCounts[0])
                .deviceCount(stationDeviceCounts[1])
                .onlineDeviceCount(stationDeviceCounts[2])
                .todayOrderCount(todayOrderCount)
                .todayRevenue(todayRevenue)
                .monthRevenue(monthRevenue)
                .totalEnergy(totalEnergy)
                .todayEnergy(todayEnergy)
                .build();
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

    @Override
    public ChartDataVO chart(Integer days) {
        if (days == null) days = 7;
        List<String> dates = new ArrayList<>();
        List<Integer> orderCounts = new ArrayList<>();
        List<Long> revenues = new ArrayList<>();
        List<Long> energies = new ArrayList<>();

        for (int i = days - 1; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            LocalDateTime dayStart = LocalDateTime.of(date, LocalTime.MIN);
            LocalDateTime dayEnd = LocalDateTime.of(date, LocalTime.MAX);
            dates.add(date.getMonthValue() + "-" + String.format("%02d", date.getDayOfMonth()));

            // 查询当日订单
            List<ChargingOrderEntity> dayOrders = orderMapper.selectList(
                    new LambdaQueryWrapper<ChargingOrderEntity>()
                            .ge(ChargingOrderEntity::getCreatedAt, dayStart)
                            .le(ChargingOrderEntity::getCreatedAt, dayEnd));

            orderCounts.add(dayOrders.size());
            revenues.add(dayOrders.stream()
                    .mapToLong(o -> o.getTotalAmount() != null ? o.getTotalAmount() : 0).sum());
            energies.add(dayOrders.stream()
                    .mapToLong(o -> o.getEnergyWh() != null ? o.getEnergyWh() : 0).sum());
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
