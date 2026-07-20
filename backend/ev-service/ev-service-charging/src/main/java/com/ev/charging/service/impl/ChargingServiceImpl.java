package com.ev.charging.service.impl;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ev.charging.dto.ChargingSessionVO;
import com.ev.charging.dto.ChargingStatsVO;
import com.ev.charging.dto.StartChargingReq;
import com.ev.charging.entity.ChargingSession;
import com.ev.charging.event.ChargingEventPublisher;
import com.ev.charging.mapper.ChargingSessionMapper;
import com.ev.charging.service.ChargingService;
import com.ev.charging.ws.ChargingStatusHandler;
import com.ev.common.core.event.ChargingStartedEvent;
import com.ev.common.core.event.ChargingStoppedEvent;
import com.ev.common.core.exception.BizException;
import com.ev.common.core.result.PageResult;
import com.ev.common.core.util.SecurityUtils;
import com.ev.common.core.util.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChargingServiceImpl implements ChargingService {

    private final ChargingEventPublisher eventPublisher;
    private final StringRedisTemplate redisTemplate;
    private final ChargingSessionMapper sessionMapper;
    // WebSocket 推送（fire-and-forget，注入失败不影响主流程）
    private ChargingStatusHandler wsHandler;

    @Autowired(required = false)
    public void setWsHandler(ChargingStatusHandler wsHandler) {
        this.wsHandler = wsHandler;
    }

    // L1 内存缓存（热点数据加速）
    private final Map<String, ChargingSessionVO> sessions = new ConcurrentHashMap<>();

    private static final String CURRENT_SESSION_KEY = "charging:current:";
    private static final String ORDER_USER_KEY = "charging:order:";

    /** 默认电价，以分为单位（175 分 = 1.75 元/kWh），从配置 charging.price-per-kwh 读取 */
    @Value("${charging.price-per-kwh:175}")
    private long defaultPricePerKwh;

    @Override
    @Transactional
    public ChargingSessionVO start(StartChargingReq req, Long userId) {
        String orderId = "ORD" + UUID.randomUUID().toString().replace("-", "");
        String sessionId = UUID.randomUUID().toString();
        log.info("启动充电: orderId={}, sessionId={}, station={}, device={}, connector={}",
                orderId, sessionId, req.getStationId(), req.getDeviceCode(), req.getConnectorId());

        // 1. 持久化到数据库
        ChargingSession entity = new ChargingSession();
        entity.setSessionId(sessionId);
        entity.setOrderId(orderId);
        entity.setUserId(userId);
        entity.setStationId(Long.parseLong(req.getStationId()));
        entity.setStationName("站点" + req.getStationId()); // FIXME: 临时 fallback，生产环境应通过 Feign 调用 station-service 获取站点名称
        entity.setDeviceCode(req.getDeviceCode());
        entity.setConnectorId(Integer.parseInt(req.getConnectorId()));
        entity.setStatus("CHARGING");
        entity.setCurrentSoc(20 + ThreadLocalRandom.current().nextInt(10)); // 模拟初始 SOC：20%~29%，生产环境应从设备真实读取
        entity.setStartSoc(entity.getCurrentSoc());
        entity.setTargetSoc(80);
        entity.setPowerW(0L);
        entity.setEnergyWh(0L);
        entity.setDurationSec(0L);
        entity.setCostCents(0L);
        entity.setMeterStart(0L);
        entity.setTenantId(TenantContext.getTenantId() != null ? TenantContext.getTenantId() : "default");
        entity.setStartedAt(LocalDateTime.now());
        entity.setDeleted(0);
        sessionMapper.insert(entity);

        // 2. 更新 L1 内存缓存
        ChargingSessionVO session = ChargingSessionVO.builder()
                .orderId(orderId)
                .stationName(entity.getStationName())
                .deviceCode(req.getDeviceCode())
                .status("charging")
                .currentSoc(entity.getCurrentSoc())
                .power(0L).energy(0L).duration(0L).cost(0L)
                .startTime(Instant.now().toString())
                .build();
        sessions.put(orderId, session);

        // 3. 记录 Redis 索引
        redisTemplate.opsForValue().set(CURRENT_SESSION_KEY + userId, orderId);
        redisTemplate.opsForValue().set(ORDER_USER_KEY + orderId, String.valueOf(userId));

        // 4. 发布事件
        eventPublisher.publishStarted(ChargingStartedEvent.of(orderId, Long.parseLong(req.getStationId()),
                entity.getStationName(), 0L, req.getDeviceCode(), Integer.parseInt(req.getConnectorId()), userId));

        // 5. WebSocket 推送初始充电状态
        pushStatusToUser(orderId, session);

        return session;
    }

    @Override
    @Transactional
    public ChargingSessionVO stop(String orderId, Long userId) {
        ChargingSessionVO session = sessions.get(orderId);
        if (session == null) {
            // 尝试从数据库恢复
            ChargingSession dbSession = sessionMapper.selectByOrderId(orderId);
            if (dbSession != null && "CHARGING".equals(dbSession.getStatus())) {
                return buildCompletedFromEntity(dbSession);
            }
            // 没有活跃会话，抛出业务异常
            throw BizException.fail("未找到活跃的充电会话");
        }

        // 停止充电，计算最终数据
        long finalEnergy = session.getEnergy();
        long finalCost = finalEnergy * defaultPricePerKwh / 1000; // Wh * 1.75元/kWh = 分

        // 更新数据库状态
        ChargingSession dbSession = sessionMapper.selectByOrderId(orderId);
        if (dbSession != null) {
            dbSession.setStatus("COMPLETED");
            dbSession.setPowerW(0L);
            dbSession.setEnergyWh(finalEnergy);
            dbSession.setDurationSec(session.getDuration());
            dbSession.setCostCents(finalCost);
            dbSession.setMeterStop(finalEnergy);
            dbSession.setStoppedAt(LocalDateTime.now());
            sessionMapper.updateById(dbSession);
        }

        // 构建返回结果
        ChargingSessionVO stopped = ChargingSessionVO.builder()
                .orderId(session.getOrderId()).stationName(session.getStationName())
                .deviceCode(session.getDeviceCode()).status("completed")
                .currentSoc(session.getCurrentSoc()).power(0L)
                .energy(finalEnergy).duration(session.getDuration()).cost(finalCost)
                .startTime(session.getStartTime()).build();

        // 清除缓存
        sessions.remove(orderId);
        String orderUserKey = ORDER_USER_KEY + orderId;
        String userIdStr = redisTemplate.opsForValue().get(orderUserKey);
        if (userIdStr != null) {
            redisTemplate.delete(CURRENT_SESSION_KEY + userIdStr);
            redisTemplate.delete(orderUserKey);
        }

        log.info("停止充电: orderId={}, energy={}Wh, cost={}cents", orderId, finalEnergy, finalCost);
        eventPublisher.publishStopped(ChargingStoppedEvent.of(orderId, 1L, finalEnergy, finalCost, session.getDuration()));

        // WebSocket 推送充电完成状态
        pushStatusToUser(orderId, stopped);

        return stopped;
    }

    @Override
    public ChargingSessionVO status(String orderId) {
        // 支持 "current" 查询：查找用户的当前活跃会话
        if ("current".equals(orderId)) {
            Long userId = SecurityUtils.getUserId();
            if (userId != null) {
                String currentOrderId = redisTemplate.opsForValue().get(CURRENT_SESSION_KEY + userId);
                if (currentOrderId != null) {
                    orderId = currentOrderId;
                } else {
                    // 尝试从数据库查找
                    ChargingSession dbSession = sessionMapper.selectActiveByUserId(userId);
                    if (dbSession != null) {
                        orderId = dbSession.getOrderId();
                    } else {
                        return buildIdleSession("current");
                    }
                }
            } else {
                return buildIdleSession("current");
            }
        }

        // 优先从 L1 内存缓存读取（纯只读，不做任何修改）
        ChargingSessionVO session = sessions.get(orderId);
        if (session == null) {
            // 尝试从数据库恢复
            ChargingSession dbSession = sessionMapper.selectByOrderId(orderId);
            if (dbSession == null) {
                return buildIdleSession(orderId);
            }
            // 如果数据库中是已完成状态，直接返回
            if ("COMPLETED".equals(dbSession.getStatus()) || "FAILED".equals(dbSession.getStatus())) {
                return buildCompletedFromEntity(dbSession);
            }
            // 恢复活跃会话到内存缓存（由定时任务更新进度）
            session = ChargingSessionVO.builder()
                    .orderId(dbSession.getOrderId())
                    .stationName(dbSession.getStationName())
                    .deviceCode(dbSession.getDeviceCode())
                    .status("charging".toLowerCase())
                    .currentSoc(dbSession.getCurrentSoc())
                    .power(dbSession.getPowerW())
                    .energy(dbSession.getEnergyWh())
                    .duration(dbSession.getDurationSec())
                    .cost(dbSession.getCostCents())
                    .startTime(dbSession.getStartedAt() != null ? dbSession.getStartedAt().toString() : "")
                    .build();
            sessions.put(orderId, session);
        }

        return session;
    }

    /**
     * 定时模拟充电进度 —— 每 5 秒遍历所有活跃会话执行 SOC 递增计算。
     * 将原本嵌入在 status() GET 请求中的有状态逻辑抽取到后台定时任务，
     * 保证 status() 是纯只读方法，符合 REST 语义。
     */
    @Scheduled(fixedRate = 5000)
    public void simulateSocProgress() {
        if (sessions.isEmpty()) {
            return;
        }

        for (Map.Entry<String, ChargingSessionVO> entry : sessions.entrySet()) {
            String orderId = entry.getKey();
            ChargingSessionVO session = entry.getValue();

            if (!"charging".equals(session.getStatus())) {
                continue;
            }

            // SOC 平滑递增算法：<80% 阶段 +1~3%/s（快充），≥80% 阶段 +0~1%/s（涓流）
            int soc = session.getCurrentSoc();
            int increment = soc < 80
                    ? ThreadLocalRandom.current().nextInt(1, 4)
                    : ThreadLocalRandom.current().nextInt(0, 2);
            int newSoc = Math.min(soc + increment, 100);
            long power = soc < 80
                    ? 90000L + ThreadLocalRandom.current().nextLong(5000L)
                    : 45000L + ThreadLocalRandom.current().nextLong(5000L);
            long newEnergy = session.getEnergy() + power / 3600;
            long newDuration = session.getDuration() + 1;
            long newCost = newEnergy * defaultPricePerKwh / 1000;

            ChargingSessionVO updated = ChargingSessionVO.builder()
                    .orderId(session.getOrderId()).stationName(session.getStationName())
                    .deviceCode(session.getDeviceCode()).status("charging")
                    .currentSoc(newSoc).power(power).energy(newEnergy).duration(newDuration)
                    .cost(newCost)
                    .startTime(session.getStartTime()).build();

            // 更新 L1 缓存
            sessions.put(orderId, updated);

            // 每 10 秒持久化一次到数据库，减少写入频率
            if (newDuration % 10 == 0) {
                try {
                    ChargingSession dbSession = sessionMapper.selectByOrderId(orderId);
                    if (dbSession != null) {
                        dbSession.setCurrentSoc(newSoc);
                        dbSession.setPowerW(power);
                        dbSession.setEnergyWh(newEnergy);
                        dbSession.setDurationSec(newDuration);
                        dbSession.setCostCents(newCost);
                        sessionMapper.updateById(dbSession);
                    }
                } catch (Exception e) {
                    log.warn("定时持久化充电会话失败: orderId={}, error={}", orderId, e.getMessage());
                }
            }

            log.debug("SOC 进度更新: orderId={}, soc={}%->{}%, power={}W, energy={}Wh, duration={}s",
                    orderId, soc, newSoc, power, newEnergy, newDuration);

            // WebSocket 实时推送（fire-and-forget）
            pushStatusToUser(orderId, updated);
        }
    }

    /**
     * 从数据库实体构建已完成的会话 VO
     */
    private ChargingSessionVO buildCompletedFromEntity(ChargingSession entity) {
        return ChargingSessionVO.builder()
                .orderId(entity.getOrderId())
                .stationName(entity.getStationName())
                .deviceCode(entity.getDeviceCode())
                .status("COMPLETED".equals(entity.getStatus()) ? "completed" : "failed")
                .currentSoc(entity.getCurrentSoc())
                .power(entity.getPowerW())
                .energy(entity.getEnergyWh())
                .duration(entity.getDurationSec())
                .cost(entity.getCostCents())
                .startTime(entity.getStartedAt() != null ? entity.getStartedAt().toString() : "")
                .build();
    }

    /**
     * 构建空闲会话 VO
     */
    private ChargingSessionVO buildIdleSession(String orderId) {
        return ChargingSessionVO.builder()
                .orderId(orderId).status("idle")
                .currentSoc(0).power(0L).energy(0L).duration(0L).cost(0L)
                .stationName("").deviceCode("")
                .startTime("").build();
    }

    /**
     * 通过 orderId 查找 userId，再通过 WebSocket 推送充电状态给前端。
     * 推送采用 fire-and-forget 策略，失败不影响主流程。
     */
    private void pushStatusToUser(String orderId, ChargingSessionVO data) {
        if (wsHandler == null) {
            return;
        }
        try {
            String userIdStr = redisTemplate.opsForValue().get(ORDER_USER_KEY + orderId);
            if (userIdStr != null) {
                ChargingStatusHandler.sendToUser(userIdStr, data);
            }
            // 同时按 orderId 推送（兼容直接按订单连接的客户端）
            ChargingStatusHandler.sendToOrder(orderId, data);
        } catch (Exception e) {
            log.debug("WebSocket推送异常(不影响主流程): orderId={}, error={}", orderId, e.getMessage());
        }
    }

    /**
     * 将数据库实体转换为 VO
     */
    private ChargingSessionVO entityToVO(ChargingSession entity) {
        String status;
        if ("COMPLETED".equals(entity.getStatus())) {
            status = "completed";
        } else if ("FAILED".equals(entity.getStatus())) {
            status = "failed";
        } else if ("CHARGING".equals(entity.getStatus())) {
            status = "charging";
        } else {
            status = entity.getStatus().toLowerCase();
        }
        return ChargingSessionVO.builder()
                .orderId(entity.getOrderId())
                .stationName(entity.getStationName())
                .deviceCode(entity.getDeviceCode())
                .status(status)
                .currentSoc(entity.getCurrentSoc())
                .power(entity.getPowerW())
                .energy(entity.getEnergyWh())
                .duration(entity.getDurationSec())
                .cost(entity.getCostCents())
                .startTime(entity.getStartedAt() != null ? entity.getStartedAt().toString() : "")
                .build();
    }

    @Override
    public PageResult<ChargingSessionVO> listSessions(int page, int size, String status, Long stationId, Long userId) {
        IPage<ChargingSession> result = sessionMapper.selectSessionPage(new Page<>(page, size), status, stationId, userId);
        var voList = result.getRecords().stream()
                .map(this::entityToVO)
                .toList();
        return PageResult.of(voList, result.getTotal(), page, size);
    }

    @Override
    public ChargingSessionVO getSessionDetail(String sessionId) {
        // 支持通过 orderId 查询（兼容原有路径参数风格）
        ChargingSession entity = sessionMapper.selectBySessionId(sessionId);
        if (entity == null) {
            entity = sessionMapper.selectByOrderId(sessionId);
        }
        if (entity == null) {
            return ChargingSessionVO.builder()
                    .orderId(sessionId).status("not_found")
                    .currentSoc(0).power(0L).energy(0L).duration(0L).cost(0L)
                    .stationName("").deviceCode("").startTime("").build();
        }
        return entityToVO(entity);
    }

    @Override
    public ChargingStatsVO getStats(LocalDateTime startDate, LocalDateTime endDate, Long stationId) {
        long totalSessions;
        long completedSessions;
        long totalEnergy;
        long totalCost;
        long totalDuration;

        if (stationId != null) {
            totalSessions = sessionMapper.countByStationAndDateRange(stationId, startDate, endDate);
            completedSessions = sessionMapper.countCompletedByStationAndDateRange(stationId, startDate, endDate);
            totalEnergy = sessionMapper.sumEnergyByStationAndDateRange(stationId, startDate, endDate);
            totalCost = sessionMapper.sumCostByStationAndDateRange(stationId, startDate, endDate);
            totalDuration = sessionMapper.sumDurationByStationAndDateRange(stationId, startDate, endDate);
        } else {
            totalSessions = sessionMapper.countByDateRange(startDate, endDate);
            completedSessions = sessionMapper.countCompletedByDateRange(startDate, endDate);
            totalEnergy = sessionMapper.sumEnergyByDateRange(startDate, endDate);
            totalCost = sessionMapper.sumCostByDateRange(startDate, endDate);
            totalDuration = sessionMapper.sumDurationByDateRange(startDate, endDate);
        }

        long avgEnergy = totalSessions > 0 ? totalEnergy / totalSessions : 0;
        long avgCost = totalSessions > 0 ? totalCost / totalSessions : 0;
        long avgDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;
        int completionRate = totalSessions > 0 ? (int) (completedSessions * 100 / totalSessions) : 0;

        return ChargingStatsVO.builder()
                .totalSessions(totalSessions)
                .totalEnergyWh(totalEnergy)
                .totalCostCents(totalCost)
                .totalDurationSec(totalDuration)
                .avgEnergyWh(avgEnergy)
                .avgCostCents(avgCost)
                .avgDurationSec(avgDuration)
                .completionRate(completionRate)
                .build();
    }

    @Override
    public PageResult<ChargingSessionVO> getUserHistory(Long userId, int page, int size) {
        IPage<ChargingSession> result = sessionMapper.selectSessionPage(new Page<>(page, size), null, null, userId);
        var voList = result.getRecords().stream()
                .map(this::entityToVO)
                .toList();
        return PageResult.of(voList, result.getTotal(), page, size);
    }
}
