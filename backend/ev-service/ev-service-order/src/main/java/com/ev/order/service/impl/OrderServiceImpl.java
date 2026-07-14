package com.ev.order.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ev.common.core.exception.BizException;
import com.ev.common.core.result.PageResult;
import com.ev.order.dto.*;
import com.ev.order.entity.ChargingOrderEntity;
import com.ev.order.mapper.ChargingOrderMapper;
import com.ev.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j @Service @RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {
    private final ChargingOrderMapper orderMapper;

    @Override
    public PageResult<OrderVO> page(OrderQuery query) {
        LambdaQueryWrapper<ChargingOrderEntity> wrapper = new LambdaQueryWrapper<>();
        if (query.getOrderNo() != null && !query.getOrderNo().isBlank()) wrapper.like(ChargingOrderEntity::getOrderNo, query.getOrderNo());
        if (query.getStatus() != null && !query.getStatus().isBlank()) wrapper.eq(ChargingOrderEntity::getStatus, query.getStatus());
        if (query.getStationId() != null) wrapper.eq(ChargingOrderEntity::getStationId, query.getStationId());
        if (query.getUserId() != null) wrapper.eq(ChargingOrderEntity::getUserId, query.getUserId());
        wrapper.orderByDesc(ChargingOrderEntity::getCreatedAt);
        Page<ChargingOrderEntity> page = orderMapper.selectPage(new Page<>(query.getPage(), query.getSize()), wrapper);
        List<OrderVO> voList = page.getRecords().stream().map(this::toVO).collect(Collectors.toList());
        return PageResult.of(voList, page.getTotal(), query.getPage(), query.getSize());
    }

    @Override
    public OrderVO detail(Long id) {
        ChargingOrderEntity entity = orderMapper.selectById(id);
        if (entity == null) throw BizException.orderNotFound();
        return toVO(entity);
    }

    @Override @Transactional
    public void refund(Long id, Long amount, String reason) {
        ChargingOrderEntity entity = orderMapper.selectById(id);
        if (entity == null) throw BizException.orderNotFound();
        if (!"PAID".equals(entity.getStatus())) throw BizException.orderStatusAbnormal();
        entity.setStatus("REFUNDING");
        orderMapper.updateById(entity);
        log.info("退款申请: orderId={}, amount={}, reason={}", id, amount, reason);
    }

    private OrderVO toVO(ChargingOrderEntity e) {
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
