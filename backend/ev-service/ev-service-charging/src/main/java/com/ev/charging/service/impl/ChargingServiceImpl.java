package com.ev.charging.service.impl;

import com.ev.charging.dto.ChargingSessionVO;
import com.ev.charging.dto.StartChargingReq;
import com.ev.charging.entity.ChargingSession;
import com.ev.charging.event.ChargingEventPublisher;
import com.ev.charging.mapper.ChargingSessionMapper;
import com.ev.charging.service.ChargingService;
import com.ev.common.core.event.ChargingStartedEvent;
import com.ev.common.core.event.ChargingStoppedEvent;
import com.ev.common.core.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
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

    // L1 内存缓存（热点数据加速）
    private final Map<String, ChargingSessionVO> sessions = new ConcurrentHashMap<>();

    private static final String CURRENT_SESSION_KEY = "charging:current:";
    private static final String ORDER_USER_KEY = "charging:order:";

    @Override
    @Transactional
    public ChargingSessionVO start(StartChargingReq req, Long userId) {
        String orderId = "ORD" + System.currentTimeMillis();
        String sessionId = UUID.randomUUID().toString();
        log.info("启动充电: orderId={}, sessionId={}, station={}, device={}, connector={}",
                orderId, sessionId, req.getStationId(), req.getDeviceCode(), req.getConnectorId());

        // 1. 持久化到数据库
        ChargingSession entity = new ChargingSession();
        entity.setSessionId(sessionId);
        entity.setOrderId(orderId);
        entity.setUserId(userId);
        entity.setStationId(Long.parseLong(req.getStationId()));
        entity.setStationName("充电站-" + req.getStationId());
        entity.setDeviceCode(req.getDeviceCode());
        entity.setConnectorId(Integer.parseInt(req.getConnectorId()));
        entity.setStatus("CHARGING");
        entity.setCurrentSoc(20 + ThreadLocalRandom.current().nextInt(10));
        entity.setStartSoc(entity.getCurrentSoc());
        entity.setTargetSoc(80);
        entity.setPowerW(0L);
        entity.setEnergyWh(0L);
        entity.setDurationSec(0L);
        entity.setCostCents(0L);
        entity.setMeterStart(0L);
        entity.setTenantId("T001");
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
            // 没有活跃会话，返回已完成状态
            return ChargingSessionVO.builder()
                    .orderId(orderId).status("completed").currentSoc(75)
                    .power(0L).energy(45500L).duration(5400L).cost(7735L)
                    .stationName("充电站").deviceCode("DEV-001")
                    .startTime(Instant.now().minusSeconds(5400).toString()).build();
        }

        // 停止充电，计算最终数据
        long finalEnergy = session.getEnergy();
        long finalCost = finalEnergy * 175 / 1000; // Wh * 1.75元/kWh = 分

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

        // 优先从 L1 内存缓存读取
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
            // 恢复活跃会话到内存缓存
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

        if (!"charging".equals(session.getStatus())) {
            return session;
        }

        // 模拟充电进度 - 平滑递增
        int soc = session.getCurrentSoc();
        int increment = soc < 80 ? ThreadLocalRandom.current().nextInt(1, 4) : ThreadLocalRandom.current().nextInt(0, 2);
        int newSoc = Math.min(soc + increment, 100);
        long power = soc < 80 ? 90000L + ThreadLocalRandom.current().nextLong(5000L) : 45000L + ThreadLocalRandom.current().nextLong(5000L);
        long newEnergy = session.getEnergy() + power / 3600;
        long newDuration = session.getDuration() + 1;
        long newCost = newEnergy * 175 / 1000;

        ChargingSessionVO updated = ChargingSessionVO.builder()
                .orderId(session.getOrderId()).stationName(session.getStationName())
                .deviceCode(session.getDeviceCode()).status("charging")
                .currentSoc(newSoc).power(power).energy(newEnergy).duration(newDuration)
                .cost(newCost)
                .startTime(session.getStartTime()).build();

        // 更新 L1 缓存
        sessions.put(orderId, updated);

        // 异步更新数据库（每 10 秒持久化一次，减少写入频率）
        if (newDuration % 10 == 0) {
            ChargingSession dbSession = sessionMapper.selectByOrderId(orderId);
            if (dbSession != null) {
                dbSession.setCurrentSoc(newSoc);
                dbSession.setPowerW(power);
                dbSession.setEnergyWh(newEnergy);
                dbSession.setDurationSec(newDuration);
                dbSession.setCostCents(newCost);
                sessionMapper.updateById(dbSession);
            }
        }

        return updated;
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
}
