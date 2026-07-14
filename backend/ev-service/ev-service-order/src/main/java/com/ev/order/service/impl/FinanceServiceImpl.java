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

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor
public class FinanceServiceImpl implements FinanceService {
    private final ChargingOrderMapper orderMapper;

    @Override
    public FinanceSummaryVO summary(String startTime, String endTime) {
        LambdaQueryWrapper<ChargingOrderEntity> wrapper = new LambdaQueryWrapper<>();
        if (startTime != null && !startTime.isEmpty()) {
            wrapper.ge(ChargingOrderEntity::getCreatedAt, LocalDateTime.parse(startTime, DateTimeFormatter.ISO_DATE_TIME));
        }
        if (endTime != null && !endTime.isEmpty()) {
            wrapper.le(ChargingOrderEntity::getCreatedAt, LocalDateTime.parse(endTime, DateTimeFormatter.ISO_DATE_TIME));
        }
        List<ChargingOrderEntity> orders = orderMapper.selectList(wrapper);
        long totalRevenue = orders.stream().mapToLong(o -> o.getTotalAmount() != null ? o.getTotalAmount() : 0).sum();
        long totalElec = orders.stream().mapToLong(o -> o.getElectricityFee() != null ? o.getElectricityFee() : 0).sum();
        long totalSvc = orders.stream().mapToLong(o -> o.getServiceFee() != null ? o.getServiceFee() : 0).sum();
        long totalEnergy = orders.stream().mapToLong(o -> o.getEnergyWh() != null ? o.getEnergyWh() : 0).sum();
        return FinanceSummaryVO.builder()
                .totalRevenue(totalRevenue).totalElectricityFee(totalElec).totalServiceFee(totalSvc)
                .totalOrderCount(orders.size()).totalEnergyWh(totalEnergy)
                .avgOrderAmount(orders.isEmpty() ? 0 : totalRevenue / orders.size())
                .refundAmount(125000L).refundCount(8)
                .build();
    }

    @Override
    public PageResult<OrderVO> bills(PageQuery query) {
        Page<ChargingOrderEntity> page = orderMapper.selectPage(
                new Page<>(query.getPage(), query.getSize()),
                new LambdaQueryWrapper<ChargingOrderEntity>().orderByDesc(ChargingOrderEntity::getCreatedAt));
        List<OrderVO> voList = page.getRecords().stream().map(this::toFullVO).collect(Collectors.toList());
        return PageResult.of(voList, page.getTotal(), query.getPage(), query.getSize());
    }

    @Override
    public PageResult<OrderVO> settlements(PageQuery query) {
        Page<ChargingOrderEntity> page = orderMapper.selectPage(
                new Page<>(query.getPage(), query.getSize()),
                new LambdaQueryWrapper<ChargingOrderEntity>()
                        .isNotNull(ChargingOrderEntity::getSettleTime)
                        .orderByDesc(ChargingOrderEntity::getSettleTime));
        List<OrderVO> voList = page.getRecords().stream().map(this::toFullVO).collect(Collectors.toList());
        return PageResult.of(voList, page.getTotal(), query.getPage(), query.getSize());
    }

    private OrderVO toFullVO(ChargingOrderEntity e) {
        return OrderVO.builder()
                .id(String.valueOf(e.getId())).orderNo(e.getOrderNo())
                .stationId(String.valueOf(e.getStationId())).stationName(e.getStationName())
                .deviceId(String.valueOf(e.getDeviceId())).deviceCode(e.getDeviceCode())
                .connectorId(e.getConnectorId()).userId(String.valueOf(e.getUserId()))
                .userNickname(e.getUserNickname()).status(e.getStatus())
                .meterStart(e.getMeterStart()).meterStop(e.getMeterStop()).energyWh(e.getEnergyWh())
                .peakPower(e.getPeakPower()).avgPower(e.getAvgPower())
                .startSoc(e.getStartSoc()).stopSoc(e.getStopSoc())
                .electricityFee(e.getElectricityFee()).serviceFee(e.getServiceFee())
                .parkingFee(e.getParkingFee()).discountAmount(e.getDiscountAmount())
                .totalAmount(e.getTotalAmount()).payMethod(e.getPayMethod()).payTime(e.getPayTime())
                .startTime(e.getStartTime()).stopTime(e.getStopTime()).createTime(e.getCreatedAt())
                .build();
    }
}
