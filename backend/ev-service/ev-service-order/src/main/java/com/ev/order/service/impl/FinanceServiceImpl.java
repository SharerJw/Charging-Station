package com.ev.order.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ev.common.core.dto.PageQuery;
import com.ev.common.core.result.PageResult;
import com.ev.order.dto.*;
import com.ev.order.entity.ChargingOrderEntity;
import com.ev.order.mapper.ChargingOrderMapper;
import com.ev.order.service.FinanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor
public class FinanceServiceImpl implements FinanceService {
    private final ChargingOrderMapper orderMapper;

    @Override
    public FinanceSummaryVO summary(String startTime, String endTime) {
        // 使用 SQL 聚合查询，避免加载全部订单到内存
        LocalDateTime start = startTime != null && !startTime.isEmpty()
            ? LocalDate.parse(startTime, DateTimeFormatter.ISO_LOCAL_DATE).atStartOfDay()
            : LocalDate.now().withDayOfMonth(1).atStartOfDay(); // 默认本月
        LocalDateTime end = endTime != null && !endTime.isEmpty()
            ? LocalDate.parse(endTime, DateTimeFormatter.ISO_LOCAL_DATE).atTime(LocalTime.MAX)
            : LocalDateTime.now();

        // 使用 SQL 聚合查询汇总数据
        QueryWrapper<ChargingOrderEntity> wrapper = new QueryWrapper<>();
        wrapper.select(
                "COUNT(*) AS order_count",
                "COALESCE(SUM(total_amount), 0) AS total_revenue",
                "COALESCE(SUM(electricity_fee), 0) AS total_electricity_fee",
                "COALESCE(SUM(service_fee), 0) AS total_service_fee",
                "COALESCE(SUM(energy_wh), 0) AS total_energy");
        wrapper.ge("created_at", start);
        wrapper.le("created_at", end);
        wrapper.in("status", "PAID", "SETTLED");

        Map<String, Object> stats = orderMapper.selectMaps(wrapper).get(0);

        long totalRevenue = getLong(stats, "total_revenue");
        long totalElec = getLong(stats, "total_electricity_fee");
        long totalSvc = getLong(stats, "total_service_fee");
        long totalEnergy = getLong(stats, "total_energy");
        int orderCount = getInt(stats, "order_count");

        // 退款统计（使用 SQL 聚合）
        QueryWrapper<ChargingOrderEntity> refundWrapper = new QueryWrapper<>();
        refundWrapper.select(
                "COUNT(*) AS refund_count",
                "COALESCE(SUM(total_amount), 0) AS refund_amount");
        refundWrapper.eq("status", "REFUNDING");

        Map<String, Object> refundStats = orderMapper.selectMaps(refundWrapper).get(0);
        long refundAmount = getLong(refundStats, "refund_amount");
        int refundCount = getInt(refundStats, "refund_count");

        return FinanceSummaryVO.builder()
            .totalRevenue(totalRevenue)
            .totalElectricityFee(totalElec)
            .totalServiceFee(totalSvc)
            .totalOrderCount(orderCount)
            .totalEnergyWh(totalEnergy)
            .avgOrderAmount(orderCount > 0 ? totalRevenue / orderCount : 0)
            .refundAmount(refundAmount)
            .refundCount(refundCount)
            .build();
    }

    private long getLong(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val instanceof Number) return ((Number) val).longValue();
        return 0L;
    }

    private int getInt(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val instanceof Number) return ((Number) val).intValue();
        return 0;
    }

    @Override
    public PageResult<OrderVO> bills(PageQuery query) {
        Page<ChargingOrderEntity> page = orderMapper.selectPage(
            new Page<>(query.getPage(), query.getSize()),
            new LambdaQueryWrapper<ChargingOrderEntity>()
                .orderByDesc(ChargingOrderEntity::getCreatedAt));
        List<OrderVO> voList = page.getRecords().stream()
            .map(this::toVO)
            .collect(Collectors.toList());
        return PageResult.of(voList, page.getTotal(), query.getPage(), query.getSize());
    }

    @Override
    public PageResult<OrderVO> settlements(PageQuery query) {
        Page<ChargingOrderEntity> page = orderMapper.selectPage(
            new Page<>(query.getPage(), query.getSize()),
            new LambdaQueryWrapper<ChargingOrderEntity>()
                .eq(ChargingOrderEntity::getStatus, "SETTLED")
                .orderByDesc(ChargingOrderEntity::getCreatedAt));
        List<OrderVO> voList = page.getRecords().stream()
            .map(this::toVO)
            .collect(Collectors.toList());
        return PageResult.of(voList, page.getTotal(), query.getPage(), query.getSize());
    }

    private OrderVO toVO(ChargingOrderEntity e) {
        return OrderVO.builder()
            .id(String.valueOf(e.getId()))
            .orderNo(e.getOrderNo())
            .stationName(e.getStationName())
            .deviceCode(e.getDeviceCode())
            .userNickname(e.getUserNickname())
            .status(e.getStatus())
            .energyWh(e.getEnergyWh())
            .totalAmount(e.getTotalAmount())
            .startTime(e.getStartTime())
            .stopTime(e.getStopTime())
            .createTime(e.getCreatedAt())
            .build();
    }
}
