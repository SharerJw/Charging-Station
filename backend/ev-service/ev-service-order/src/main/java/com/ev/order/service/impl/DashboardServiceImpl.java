package com.ev.order.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ev.common.core.result.PageResult;
import com.ev.order.dto.*;
import com.ev.order.entity.ChargingOrderEntity;
import com.ev.order.entity.DeviceAlertEntity;
import com.ev.order.mapper.ChargingOrderMapper;
import com.ev.order.mapper.DeviceAlertMapper;
import com.ev.order.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {
    private final ChargingOrderMapper orderMapper;
    private final DeviceAlertMapper alertMapper;

    @Override
    public DashboardStatsVO stats() {
        LocalDateTime todayStart = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime monthStart = LocalDateTime.of(LocalDate.now().withDayOfMonth(1), LocalTime.MIN);
        Long todayRevenue = orderMapper.selectList(new LambdaQueryWrapper<ChargingOrderEntity>()
                .ge(ChargingOrderEntity::getCreatedAt, todayStart))
                .stream().mapToLong(o -> o.getTotalAmount() != null ? o.getTotalAmount() : 0).sum();
        Long monthRevenue = orderMapper.selectList(new LambdaQueryWrapper<ChargingOrderEntity>()
                .ge(ChargingOrderEntity::getCreatedAt, monthStart))
                .stream().mapToLong(o -> o.getTotalAmount() != null ? o.getTotalAmount() : 0).sum();
        Long todayEnergy = orderMapper.selectList(new LambdaQueryWrapper<ChargingOrderEntity>()
                .ge(ChargingOrderEntity::getCreatedAt, todayStart))
                .stream().mapToLong(o -> o.getEnergyWh() != null ? o.getEnergyWh() : 0).sum();
        return DashboardStatsVO.builder()
                .stationCount(5).deviceCount(12).onlineDeviceCount(10)
                .todayOrderCount(156).todayRevenue(todayRevenue).monthRevenue(monthRevenue)
                .totalEnergy(125680L).todayEnergy(todayEnergy)
                .build();
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
            dates.add(date.getMonthValue() + "-" + String.format("%02d", date.getDayOfMonth()));
            orderCounts.add(120 + new Random().nextInt(50));
            revenues.add(682000L + new Random().nextLong(300000L));
            energies.add(3800L + new Random().nextLong(1000L));
        }
        return ChartDataVO.builder().dates(dates).orderCounts(orderCounts).revenues(revenues).energies(energies).build();
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
