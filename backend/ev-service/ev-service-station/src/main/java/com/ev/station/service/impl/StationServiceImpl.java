package com.ev.station.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ev.common.core.exception.BizException;
import com.ev.common.core.result.PageResult;
import com.ev.common.core.util.SanitizeUtil;
import com.ev.station.dto.*;
import com.ev.station.entity.DeviceEntity;
import com.ev.station.entity.StationEntity;
import com.ev.station.mapper.DeviceMapper;
import com.ev.station.mapper.StationMapper;
import com.ev.station.service.StationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StationServiceImpl implements StationService {

    private static final String STATUS_DELETED = "DELETED";

    private final StationMapper stationMapper;
    private final DeviceMapper deviceMapper;

    @Override
    public PageResult<StationVO> page(StationQuery query) {
        LambdaQueryWrapper<StationEntity> wrapper = new LambdaQueryWrapper<>();
        // Z-006 fix: 排除已删除记录
        wrapper.ne(StationEntity::getStatus, STATUS_DELETED);
        if (query.getKeyword() != null && !query.getKeyword().isBlank()) {
            wrapper.and(w -> w.like(StationEntity::getName, query.getKeyword())
                    .or().like(StationEntity::getCode, query.getKeyword())
                    .or().like(StationEntity::getAddress, query.getKeyword()));
        }
        if (query.getStatus() != null && !query.getStatus().isBlank()) {
            wrapper.eq(StationEntity::getStatus, query.getStatus());
        }
        if (query.getCity() != null && !query.getCity().isBlank()) {
            wrapper.eq(StationEntity::getCity, query.getCity());
        }
        wrapper.orderByDesc(StationEntity::getCreatedAt);
        Page<StationEntity> page = stationMapper.selectPage(new Page<>(query.getPage(), query.getSize()), wrapper);
        List<StationVO> voList = page.getRecords().stream().map(this::toVO).collect(Collectors.toList());
        return PageResult.of(voList, page.getTotal(), query.getPage(), query.getSize());
    }

    @Override
    public StationVO detail(Long id) {
        StationEntity entity = stationMapper.selectById(id);
        if (entity == null || STATUS_DELETED.equals(entity.getStatus())) {
            throw BizException.stationNotFound();
        }
        return toVO(entity);
    }

    @Override
    @Transactional
    public StationVO create(StationCreateReq req) {
        StationEntity existing = stationMapper.selectOne(
                new LambdaQueryWrapper<StationEntity>().eq(StationEntity::getCode, req.getCode()));
        if (existing != null) {
            throw BizException.stationDuplicateCode();
        }

        StationEntity entity = new StationEntity();
        // Z-012 fix: 显式字段映射，不使用 BeanUtils.copyProperties（防止 mass assignment）
        mapFromReq(entity, req);
        entity.setStatus("ACTIVE");
        entity.setTotalPorts(0);
        entity.setAvailablePorts(0);
        stationMapper.insert(entity);
        return toVO(entity);
    }

    @Override
    @Transactional
    public StationVO update(Long id, StationCreateReq req) {
        StationEntity entity = stationMapper.selectById(id);
        if (entity == null || STATUS_DELETED.equals(entity.getStatus())) {
            throw BizException.stationNotFound();
        }
        // Z-012 fix: 显式字段映射，不使用 BeanUtils.copyProperties
        mapFromReq(entity, req);
        entity.setId(id);
        stationMapper.updateById(entity);
        return toVO(entity);
    }

    /**
     * Z-011 fix: 软删除 - 设状态为 DELETED 而非物理删除
     */
    @Override
    @Transactional
    public void delete(Long id) {
        StationEntity entity = stationMapper.selectById(id);
        if (entity == null || STATUS_DELETED.equals(entity.getStatus())) {
            throw BizException.stationNotFound();
        }
        entity.setStatus(STATUS_DELETED);
        stationMapper.updateById(entity);
    }

    @Override
    public void updateStatus(Long id, String status) {
        StationEntity entity = stationMapper.selectById(id);
        if (entity == null || STATUS_DELETED.equals(entity.getStatus())) {
            throw BizException.stationNotFound();
        }
        entity.setStatus(status);
        stationMapper.updateById(entity);
    }

    @Override
    public List<StationVO> search(String keyword) {
        LambdaQueryWrapper<StationEntity> wrapper = new LambdaQueryWrapper<>();
        if (keyword != null && !keyword.isBlank()) {
            wrapper.like(StationEntity::getName, keyword).or().like(StationEntity::getAddress, keyword);
        }
        wrapper.eq(StationEntity::getStatus, "ACTIVE");
        return stationMapper.selectList(wrapper).stream().map(this::toVO).collect(Collectors.toList());
    }

    /**
     * Z-012 fix: 显式字段映射 + D-015 fix: XSS 输入清理
     */
    private void mapFromReq(StationEntity entity, StationCreateReq req) {
        entity.setCode(SanitizeUtil.sanitize(req.getCode()));
        entity.setName(SanitizeUtil.sanitize(req.getName()));
        entity.setType(req.getType());
        entity.setProvince(SanitizeUtil.sanitize(req.getProvince()));
        entity.setCity(SanitizeUtil.sanitize(req.getCity()));
        entity.setDistrict(SanitizeUtil.sanitize(req.getDistrict()));
        entity.setAddress(SanitizeUtil.sanitize(req.getAddress()));
        entity.setLongitude(req.getLongitude());
        entity.setLatitude(req.getLatitude());
        entity.setContactName(SanitizeUtil.sanitize(req.getContactName()));
        entity.setContactPhone(req.getContactPhone());
        entity.setElectricityPrice(req.getElectricityPrice());
        entity.setServicePrice(req.getServicePrice());
        entity.setParkingPrice(req.getParkingPrice());
    }

    private StationVO toVO(StationEntity entity) {
        Long deviceCount = deviceMapper.selectCount(new LambdaQueryWrapper<DeviceEntity>()
                .eq(DeviceEntity::getStationId, entity.getId()));
        Long onlineCount = deviceMapper.selectCount(new LambdaQueryWrapper<DeviceEntity>()
                .eq(DeviceEntity::getStationId, entity.getId()).eq(DeviceEntity::getStatus, "ONLINE"));
        return StationVO.builder()
                .id(String.valueOf(entity.getId())).code(entity.getCode()).name(entity.getName())
                .type(entity.getType()).status(entity.getStatus())
                .province(entity.getProvince()).city(entity.getCity()).district(entity.getDistrict())
                .address(entity.getAddress()).longitude(entity.getLongitude()).latitude(entity.getLatitude())
                .contactName(entity.getContactName()).contactPhone(entity.getContactPhone())
                .electricityPrice(entity.getElectricityPrice()).servicePrice(entity.getServicePrice())
                .parkingPrice(entity.getParkingPrice())
                .totalPorts(entity.getTotalPorts()).availablePorts(entity.getAvailablePorts())
                .deviceCount(deviceCount.intValue()).onlineDeviceCount(onlineCount.intValue())
                .todayOrderCount(0).todayRevenue(0L)
                .createTime(entity.getCreatedAt())
                .build();
    }
}
