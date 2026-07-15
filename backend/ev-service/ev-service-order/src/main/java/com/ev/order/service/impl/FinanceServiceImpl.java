package com.ev.order.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
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

        // 查询汇总数据
        List<ChargingOrderEntity> orders = orderMapper.selectList(
            new LambdaQueryWrapper<ChargingOrderEntity>()
                .ge(ChargingOrderEntity::getCreatedAt, start)
                .le(ChargingOrderEntity::getCreatedAt, end)
                .in(ChargingOrderEntity::getStatus, "PAID", "SETTLED")
        );

        long totalRevenue = orders.stream().mapToLong(o -> o.getTotalAmount() != null ? o.getTotalAmount() : 0).sum();
        long totalElec = orders.stream().mapToLong(o -> o.getElectricityFee() != null ? o.getElectricityFee() : 0).sum();
        long totalSvc = orders.stream().mapToLong(o -> o.getServiceFee() != null ? o.getServiceFee() : 0).sum();
        long totalEnergy = orders.stream().mapToLong(o -> o.getEnergyWh() != null ? o.getEnergyWh() : 0).sum();

        // 退款统计
        List<ChargingOrderEntity> refundedOrders = orderMapper.selectList(
            new LambdaQueryWrapper<ChargingOrderEntity>()
                .eq(ChargingOrderEntity::getStatus, "REFUNDING")
        );
        long refundAmount = refundedOrders.stream()
            .mapToLong(o -> o.getTotalAmount() != null ? o.getTotalAmount() : 0).sum();

        return FinanceSummaryVO.builder()
            .totalRevenue(totalRevenue)
            .totalElectricityFee(totalElec)
            .totalServiceFee(totalSvc)
            .totalOrderCount(orders.size())
            .totalEnergyWh(totalEnergy)
            .avgOrderAmount(orders.isEmpty() ? 0 : totalRevenue / orders.size())
            .refundAmount(refundAmount)
            .refundCount(refundedOrders.size())
            .build();
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
