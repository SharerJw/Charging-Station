package com.ev.station.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ev.common.core.exception.BizException;
import com.ev.common.core.result.PageResult;
import com.ev.station.dto.*;
import com.ev.station.entity.ConnectorEntity;
import com.ev.station.entity.DeviceEntity;
import com.ev.station.entity.DeviceFaultEntity;
import com.ev.station.mapper.ConnectorMapper;
import com.ev.station.mapper.DeviceFaultMapper;
import com.ev.station.mapper.DeviceMapper;
import com.ev.station.service.DeviceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DeviceServiceImpl implements DeviceService {
    private final DeviceMapper deviceMapper;
    private final ConnectorMapper connectorMapper;
    private final DeviceFaultMapper deviceFaultMapper;

    @Override
    public PageResult<DeviceVO> page(DeviceQuery query) {
        LambdaQueryWrapper<DeviceEntity> wrapper = new LambdaQueryWrapper<>();
        if (query.getKeyword() != null && !query.getKeyword().isBlank()) {
            wrapper.and(w -> w.like(DeviceEntity::getName, query.getKeyword())
                    .or().like(DeviceEntity::getCode, query.getKeyword()));
        }
        if (query.getStationId() != null) wrapper.eq(DeviceEntity::getStationId, query.getStationId());
        if (query.getStatus() != null && !query.getStatus().isBlank()) wrapper.eq(DeviceEntity::getStatus, query.getStatus());
        wrapper.orderByDesc(DeviceEntity::getCreatedAt);
        Page<DeviceEntity> result = deviceMapper.selectPage(new Page<>(query.getPage(), query.getSize()), wrapper);
        List<DeviceVO> voList = result.getRecords().stream().map(this::toVO).collect(Collectors.toList());
        return PageResult.of(voList, result.getTotal(), query.getPage(), query.getSize());
    }

    @Override
    public DeviceVO detail(Long id) {
        DeviceEntity entity = deviceMapper.selectById(id);
        if (entity == null) throw BizException.deviceNotFound();
        return toVO(entity);
    }

    @Override
    public List<DeviceVO> listByStation(Long stationId) {
        return deviceMapper.selectList(new LambdaQueryWrapper<DeviceEntity>()
                .eq(DeviceEntity::getStationId, stationId).orderByAsc(DeviceEntity::getCode))
                .stream().map(this::toVO).collect(Collectors.toList());
    }

    @Override
    public void reset(Long id) {
        DeviceEntity entity = deviceMapper.selectById(id);
        if (entity == null) throw BizException.deviceNotFound();
        entity.setStatus("RESETTING");
        deviceMapper.updateById(entity);
        log.info("远程重启设备: id={}, code={}", id, entity.getCode());
    }

    @Override
    public void unlock(Long id, Integer connectorId) {
        DeviceEntity entity = deviceMapper.selectById(id);
        if (entity == null) throw BizException.deviceNotFound();
        ConnectorEntity connector = connectorMapper.selectOne(new LambdaQueryWrapper<ConnectorEntity>()
                .eq(ConnectorEntity::getDeviceId, id).eq(ConnectorEntity::getConnectorId, connectorId));
        if (connector == null) throw BizException.deviceNotFound();
        connector.setStatus("AVAILABLE");
        connectorMapper.updateById(connector);
        log.info("解锁枪头: deviceId={}, connectorId={}", id, connectorId);
    }

    @Override
    public Map<String, Object> deviceStatus(Long id) {
        DeviceEntity entity = deviceMapper.selectById(id);
        if (entity == null) throw BizException.deviceNotFound();
        List<ConnectorEntity> connectors = connectorMapper.selectList(
                new LambdaQueryWrapper<ConnectorEntity>().eq(ConnectorEntity::getDeviceId, id)
                        .orderByAsc(ConnectorEntity::getConnectorId));
        List<Map<String, Object>> connectorStatusList = connectors.stream().map(c -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("connectorId", c.getConnectorId());
            m.put("type", c.getType());
            m.put("status", c.getStatus());
            m.put("maxPower", c.getMaxPower());
            m.put("currentTransactionId", c.getCurrentTransactionId());
            return m;
        }).collect(Collectors.toList());
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("deviceId", entity.getId());
        result.put("deviceCode", entity.getCode());
        result.put("status", entity.getStatus());
        result.put("lifecycle", entity.getLifecycle());
        result.put("ratedPower", entity.getRatedPower());
        result.put("connectors", connectorStatusList);
        return result;
    }

    @Override
    public List<Map<String, Object>> deviceFaults(Long id) {
        DeviceEntity entity = deviceMapper.selectById(id);
        if (entity == null) throw BizException.deviceNotFound();
        List<DeviceFaultEntity> faults = deviceFaultMapper.selectList(
                new LambdaQueryWrapper<DeviceFaultEntity>()
                        .eq(DeviceFaultEntity::getDeviceId, id)
                        .orderByDesc(DeviceFaultEntity::getOccurredAt));
        return faults.stream().map(f -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", f.getId());
            m.put("faultCode", f.getFaultCode());
            m.put("faultDescription", f.getFaultDescription());
            m.put("level", f.getLevel());
            m.put("status", f.getStatus());
            m.put("occurredAt", f.getOccurredAt());
            m.put("resolvedAt", f.getResolvedAt());
            return m;
        }).collect(Collectors.toList());
    }

    private DeviceVO toVO(DeviceEntity entity) {
        List<ConnectorEntity> connectors = connectorMapper.selectList(
                new LambdaQueryWrapper<ConnectorEntity>().eq(ConnectorEntity::getDeviceId, entity.getId())
                        .orderByAsc(ConnectorEntity::getConnectorId));
        List<ConnectorVO> connectorVOs = connectors.stream().map(c -> ConnectorVO.builder()
                .id(String.valueOf(c.getId())).connectorId(c.getConnectorId()).type(c.getType())
                .status(c.getStatus()).maxPower(c.getMaxPower())
                .currentTransactionId(c.getCurrentTransactionId()).build()).collect(Collectors.toList());
        return DeviceVO.builder()
                .id(String.valueOf(entity.getId())).stationId(String.valueOf(entity.getStationId()))
                .code(entity.getCode()).ocppId(entity.getOcppId()).name(entity.getName())
                .type(entity.getType()).model(entity.getModel()).vendor(entity.getVendor())
                .ratedPower(entity.getRatedPower()).firmwareVersion(entity.getFirmwareVersion())
                .status(entity.getStatus()).lifecycle(entity.getLifecycle())
                .connectors(connectorVOs).createTime(entity.getCreatedAt())
                .build();
    }
}
