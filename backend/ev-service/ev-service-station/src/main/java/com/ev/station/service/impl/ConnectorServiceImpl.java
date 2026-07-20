package com.ev.station.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ev.common.core.exception.BizException;
import com.ev.station.dto.ConnectorVO;
import com.ev.station.entity.ConnectorEntity;
import com.ev.station.mapper.ConnectorMapper;
import com.ev.station.service.ConnectorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConnectorServiceImpl implements ConnectorService {
    private final ConnectorMapper connectorMapper;

    @Override
    public List<ConnectorVO> listByDevice(Long deviceId) {
        return connectorMapper.selectList(new LambdaQueryWrapper<ConnectorEntity>()
                .eq(ConnectorEntity::getDeviceId, deviceId)
                .orderByAsc(ConnectorEntity::getConnectorId))
                .stream().map(this::toVO).collect(Collectors.toList());
    }

    @Override
    public ConnectorVO getDetail(Long id) {
        ConnectorEntity entity = connectorMapper.selectById(id);
        if (entity == null) throw BizException.deviceNotFound();
        return toVO(entity);
    }

    @Override
    public void updateStatus(Long id, String status) {
        ConnectorEntity entity = connectorMapper.selectById(id);
        if (entity == null) throw BizException.deviceNotFound();
        entity.setStatus(status);
        connectorMapper.updateById(entity);
        log.info("更新连接器状态: id={}, status={}", id, status);
    }

    private ConnectorVO toVO(ConnectorEntity entity) {
        return ConnectorVO.builder()
                .id(String.valueOf(entity.getId()))
                .connectorId(entity.getConnectorId())
                .type(entity.getType())
                .status(entity.getStatus())
                .maxPower(entity.getMaxPower())
                .currentTransactionId(entity.getCurrentTransactionId())
                .build();
    }
}
