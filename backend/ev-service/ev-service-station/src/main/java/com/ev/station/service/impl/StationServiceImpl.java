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

import java.math.BigDecimal;
import java.util.*;
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

    /** 内存排序时最大加载站点数，防止全表加载 */
    private static final int MAX_SORT_LIMIT = 2000;

    @Override
    public PageResult<StationVO> search(StationQuery query) {
        LambdaQueryWrapper<StationEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(StationEntity::getStatus, "ACTIVE");

        if (query.getKeyword() != null && !query.getKeyword().isBlank()) {
            wrapper.and(w -> w.like(StationEntity::getName, query.getKeyword())
                    .or().like(StationEntity::getCode, query.getKeyword())
                    .or().like(StationEntity::getAddress, query.getKeyword()));
        }
        if (query.getCity() != null && !query.getCity().isBlank()) {
            wrapper.eq(StationEntity::getCity, query.getCity());
        }

        boolean hasLocation = query.getLatitude() != null && query.getLongitude() != null;
        boolean hasRadius = query.getRadius() != null && query.getRadius() > 0;

        String sortType = (query.getSort() != null && !query.getSort().isBlank())
                ? query.getSort().toUpperCase()
                : (hasLocation ? "DISTANCE" : "SMART");
        if ("DISTANCE".equals(sortType) && !hasLocation) {
            sortType = "SMART";
        }

        boolean needMemorySort = hasLocation || "SMART".equals(sortType) || "PRICE".equals(sortType);

        int page = query.getPage();
        int size = query.getSize();
        List<StationVO> voList;
        long total;

        if (needMemorySort) {
            // ── 性能优化：实体层过滤排序 → 仅最终页转 VO ──
            wrapper.orderByDesc(StationEntity::getCreatedAt);
            Page<StationEntity> full = stationMapper.selectPage(new Page<>(1, MAX_SORT_LIMIT), wrapper);
            total = full.getTotal();

            double userLat = hasLocation ? query.getLatitude() : 0;
            double userLng = hasLocation ? query.getLongitude() : 0;
            double radiusMeters = hasRadius ? query.getRadius() * 1000 : Double.MAX_VALUE;

            // 第1步：在实体层计算距离，构建轻量中间对象（避免创建完整 VO）
            List<StationCandidate> candidates = new ArrayList<>(full.getRecords().size());
            for (StationEntity e : full.getRecords()) {
                double dist = Double.MAX_VALUE;
                if (hasLocation && e.getLatitude() != null && e.getLongitude() != null) {
                    dist = haversine(userLat, userLng,
                            e.getLatitude().doubleValue(), e.getLongitude().doubleValue());
                    if (dist > radiusMeters) continue; // 距离过滤，直接跳过
                }
                candidates.add(new StationCandidate(e, Math.round(dist * 10.0) / 10.0));
            }
            total = hasLocation ? candidates.size() : total;

            // 第2步：在中间对象层排序（轻量，无 VO 开销）
            sortCandidates(candidates, sortType);

            // 第3步：手动分页
            int from = Math.min((page - 1) * size, candidates.size());
            int to = Math.min(from + size, candidates.size());
            List<StationCandidate> pageSlice = candidates.subList(from, to);

            // 第4步：仅对当前页执行批量设备数查询 + 转 VO（1~2 次 SQL）
            voList = batchToVO(pageSlice, hasLocation);

        } else {
            wrapper.orderByDesc(StationEntity::getCreatedAt);
            Page<StationEntity> pageResult = stationMapper.selectPage(new Page<>(page, size), wrapper);
            total = pageResult.getTotal();
            voList = batchToVO(pageResult.getRecords().stream()
                    .map(e -> new StationCandidate(e, null))
                    .collect(Collectors.toList()), false);
        }

        return PageResult.of(voList, total, page, size);
    }

    // ── 轻量中间对象（仅含排序所需字段，不触发额外 SQL） ──
    private record StationCandidate(StationEntity entity, Double distance) {}

    // ── Haversine 公式（内联版，避免 BigDecimal 拆箱开销） ──
    private static final double EARTH_R = 6_371_000.0;
    private static double haversine(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat * 0.5);
        a *= a;
        double b = Math.sin(dLng * 0.5);
        b *= b;
        a += Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) * b;
        return EARTH_R * 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));
    }

    // ── 中间对象排序（无 VO 开销） ──
    private void sortCandidates(List<StationCandidate> list, String sortType) {
        switch (sortType) {
            case "DISTANCE" -> list.sort(Comparator.comparingDouble(c ->
                    c.distance() != null ? c.distance() : Double.MAX_VALUE));

            case "PRICE" -> list.sort(Comparator.comparingDouble(c -> {
                StationEntity e = c.entity();
                double ep = e.getElectricityPrice() != null ? e.getElectricityPrice().doubleValue() : 0;
                double sp = e.getServicePrice() != null ? e.getServicePrice().doubleValue() : 0;
                return ep + sp;
            }));

            case "SMART" -> {
                double maxDist = list.stream().filter(c -> c.distance() != null)
                        .mapToDouble(StationCandidate::distance).max().orElse(50000.0);
                double maxPrice = list.stream().mapToDouble(c -> {
                    StationEntity e = c.entity();
                    double ep = e.getElectricityPrice() != null ? e.getElectricityPrice().doubleValue() : 0;
                    double sp = e.getServicePrice() != null ? e.getServicePrice().doubleValue() : 0;
                    return ep + sp;
                }).max().orElse(2.0);
                if (maxDist == 0) maxDist = 1;
                if (maxPrice == 0) maxPrice = 1;
                final double nd = maxDist, np = maxPrice;

                list.sort(Comparator.comparingDouble((StationCandidate c) -> {
                    double distScore = c.distance() != null ? 1.0 - c.distance() / nd : 0.5;
                    StationEntity e = c.entity();
                    double price = (e.getElectricityPrice() != null ? e.getElectricityPrice().doubleValue() : 0)
                            + (e.getServicePrice() != null ? e.getServicePrice().doubleValue() : 0);
                    double priceScore = 1.0 - price / np;
                    double total = e.getTotalPorts() != null ? e.getTotalPorts() : 0;
                    double avail = e.getAvailablePorts() != null ? e.getAvailablePorts() : 0;
                    double availScore = total > 0 ? avail / total : 0.0;
                    return -(distScore * 0.4 + priceScore * 0.3 + availScore * 0.3);
                }));
            }
        }
    }

    /**
     * 批量转换 VO：仅对当前页数据执行 2 次批量 SQL 查设备数
     * 替代原 toVO() 的 N×2 次单条查询
     */
    private List<StationVO> batchToVO(List<StationCandidate> candidates, boolean includeDistance) {
        if (candidates.isEmpty()) return List.of();

        List<Long> stationIds = candidates.stream()
                .map(c -> c.entity().getId())
                .collect(Collectors.toList());

        // 2 次批量 SQL（替代 2N 次）
        Map<Long, Integer> deviceCountMap = new HashMap<>();
        Map<Long, Integer> onlineCountMap = new HashMap<>();
        deviceMapper.countByStationIds(stationIds).forEach(row ->
                deviceCountMap.put(((Number) row.get("station_id")).longValue(),
                        ((Number) row.get("cnt")).intValue()));
        deviceMapper.countOnlineByStationIds(stationIds).forEach(row ->
                onlineCountMap.put(((Number) row.get("station_id")).longValue(),
                        ((Number) row.get("cnt")).intValue()));

        return candidates.stream().map(c -> {
            StationEntity e = c.entity();
            return StationVO.builder()
                    .id(String.valueOf(e.getId()))
                    .code(e.getCode())
                    .name(e.getName())
                    .type(e.getType())
                    .status(e.getStatus())
                    .province(e.getProvince())
                    .city(e.getCity())
                    .district(e.getDistrict())
                    .address(e.getAddress())
                    .longitude(e.getLongitude())
                    .latitude(e.getLatitude())
                    .contactName(e.getContactName())
                    .contactPhone(e.getContactPhone())
                    .electricityPrice(e.getElectricityPrice())
                    .servicePrice(e.getServicePrice())
                    .parkingPrice(e.getParkingPrice())
                    .totalPorts(e.getTotalPorts())
                    .availablePorts(e.getAvailablePorts())
                    .deviceCount(deviceCountMap.getOrDefault(e.getId(), 0))
                    .onlineDeviceCount(onlineCountMap.getOrDefault(e.getId(), 0))
                    .todayOrderCount(0)
                    .todayRevenue(0L)
                    .createTime(e.getCreatedAt())
                    .distance(includeDistance ? c.distance() : null)
                    .build();
        }).collect(Collectors.toList());
    }

    private double calcDistance(double lat1, double lng1, double lat2, double lng2) {
        double R = 6371000; // 地球半径（米）
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
