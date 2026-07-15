package com.ev.order.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ev.common.core.dto.PageQuery;
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

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {
    private final ChargingOrderMapper orderMapper;

    @Override
    public PageResult<OrderVO> page(PageQuery query, Long userId) {
        LambdaQueryWrapper<ChargingOrderEntity> wrapper = new LambdaQueryWrapper<>();

        // 运维管理端筛选条件（仅当 query 为 OrderQuery 时生效）
        if (query instanceof OrderQuery oq) {
            if (oq.getOrderNo() != null && !oq.getOrderNo().isBlank()) {
                wrapper.like(ChargingOrderEntity::getOrderNo, oq.getOrderNo());
            }
            if (oq.getStationId() != null) {
                wrapper.eq(ChargingOrderEntity::getStationId, oq.getStationId());
            }
            // 管理端可通过 query.userId 做筛选，但不作为安全约束
            if (oq.getUserId() != null && userId == null) {
                wrapper.eq(ChargingOrderEntity::getUserId, oq.getUserId());
            }
        }

        // 用户端筛选条件（仅当 query 为 UserOrderQuery 时生效）
        if (query instanceof UserOrderQuery uoq) {
            if (uoq.getStatus() != null && !uoq.getStatus().isBlank()) {
                wrapper.eq(ChargingOrderEntity::getStatus, uoq.getStatus());
            }
        } else if (query instanceof OrderQuery oq2) {
            // OrderQuery 的 status 字段
            if (oq2.getStatus() != null && !oq2.getStatus().isBlank()) {
                wrapper.eq(ChargingOrderEntity::getStatus, oq2.getStatus());
            }
        }

        // 安全约束：当 userId 非空时，强制只查询该用户的订单（防止水平越权）
        if (userId != null) {
            wrapper.eq(ChargingOrderEntity::getUserId, userId);
        }

        wrapper.orderByDesc(ChargingOrderEntity::getCreatedAt);
        Page<ChargingOrderEntity> page = orderMapper.selectPage(
                new Page<>(query.getPage(), query.getSize()), wrapper);
        List<OrderVO> voList = page.getRecords().stream().map(this::toVO).collect(Collectors.toList());
        return PageResult.of(voList, page.getTotal(), query.getPage(), query.getSize());
    }

    @Override
    public OrderVO detail(Long id, Long userId) {
        ChargingOrderEntity entity = orderMapper.selectById(id);
        if (entity == null) {
            throw BizException.orderNotFound();
        }
        // 水平越权防护：非管理员只能查看自己的订单
        if (userId != null && !userId.equals(entity.getUserId())) {
            throw BizException.noPermission();
        }
        return toVO(entity);
    }

    @Override
    @Transactional
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
