package com.ev.order.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ev.common.core.dto.PageQuery;
import com.ev.common.core.exception.BizException;
import com.ev.common.core.result.PageResult;
import com.ev.order.dto.AlertVO;
import com.ev.order.entity.DeviceAlertEntity;
import com.ev.order.mapper.DeviceAlertMapper;
import com.ev.order.service.AlertService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AlertServiceImpl implements AlertService {

    private final DeviceAlertMapper alertMapper;

    @Override
    public PageResult<AlertVO> page(PageQuery query, String level, String status, String keyword) {
        LambdaQueryWrapper<DeviceAlertEntity> wrapper = new LambdaQueryWrapper<>();
        if (level != null && !level.isBlank()) {
            wrapper.eq(DeviceAlertEntity::getLevel, level);
        }
        if (status != null && !status.isBlank()) {
            wrapper.eq(DeviceAlertEntity::getStatus, status);
        }
        if (keyword != null && !keyword.isBlank()) {
            wrapper.and(w -> w
                    .like(DeviceAlertEntity::getTitle, keyword)
                    .or().like(DeviceAlertEntity::getStationName, keyword)
                    .or().like(DeviceAlertEntity::getDeviceCode, keyword));
        }
        wrapper.orderByDesc(DeviceAlertEntity::getCreatedAt);

        Page<DeviceAlertEntity> page = alertMapper.selectPage(
                new Page<>(query.getPage(), query.getSize()), wrapper);
        List<AlertVO> voList = page.getRecords().stream()
                .map(this::toVO).collect(Collectors.toList());
        return PageResult.of(voList, page.getTotal(), query.getPage(), query.getSize());
    }

    @Override
    @Transactional
    public AlertVO handle(Long id, String handler, String result) {
        DeviceAlertEntity alert = alertMapper.selectById(id);
        if (alert == null) {
            throw BizException.of(2001, "告警不存在");
        }
        alert.setStatus("resolved");
        alert.setHandler(handler != null ? handler : "运维工程师");
        alert.setHandleResult(result != null ? result : "已处理");
        alert.setHandleTime(LocalDateTime.now());
        alertMapper.updateById(alert);
        log.info("告警已处理: alertId={}, handler={}", id, alert.getHandler());
        return toVO(alert);
    }

    @Override
    @Transactional
    public void ignore(Long id, String note) {
        DeviceAlertEntity alert = alertMapper.selectById(id);
        if (alert == null) {
            throw BizException.of(2001, "告警不存在");
        }
        alert.setStatus("ignored");
        alertMapper.updateById(alert);
        log.info("告警已忽略: alertId={}", id);
    }

    private AlertVO toVO(DeviceAlertEntity a) {
        return AlertVO.builder()
                .id(String.valueOf(a.getId())).level(a.getLevel()).title(a.getTitle())
                .description(a.getDescription()).stationName(a.getStationName())
                .deviceCode(a.getDeviceCode()).status(a.getStatus())
                .handler(a.getHandler()).handleResult(a.getHandleResult())
                .handleTime(a.getHandleTime()).createTime(a.getCreatedAt())
                .build();
    }
}
