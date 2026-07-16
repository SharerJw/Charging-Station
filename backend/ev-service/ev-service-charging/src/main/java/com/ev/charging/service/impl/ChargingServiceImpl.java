package com.ev.charging.service.impl;

import com.ev.charging.dto.ChargingSessionVO;
import com.ev.charging.dto.StartChargingReq;
import com.ev.charging.event.ChargingEventPublisher;
import com.ev.charging.service.ChargingService;
import com.ev.common.core.event.ChargingStartedEvent;
import com.ev.common.core.event.ChargingStoppedEvent;
import com.ev.common.core.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChargingServiceImpl implements ChargingService {

    private final ChargingEventPublisher eventPublisher;
    private final StringRedisTemplate redisTemplate;

    // In-memory charging sessions
    private final Map<String, ChargingSessionVO> sessions = new ConcurrentHashMap<>();

    private static final String CURRENT_SESSION_KEY = "charging:current:";

    @Override
    public ChargingSessionVO start(StartChargingReq req, Long userId) {
        String orderId = "ORD" + System.currentTimeMillis();
        log.info("启动充电: orderId={}, station={}, device={}, connector={}", orderId, req.getStationId(), req.getDeviceCode(), req.getConnectorId());

        ChargingSessionVO session = ChargingSessionVO.builder()
                .orderId(orderId)
                .stationName("充电站-" + req.getStationId())
                .deviceCode(req.getDeviceCode())
                .status("charging")
                .currentSoc(20 + ThreadLocalRandom.current().nextInt(10))
                .power(0L).energy(0L).duration(0L).cost(0L)
                .startTime(Instant.now().toString())
                .build();

        sessions.put(orderId, session);

        // 记录用户的当前活跃会话
        redisTemplate.opsForValue().set(CURRENT_SESSION_KEY + userId, orderId);

        eventPublisher.publishStarted(ChargingStartedEvent.of(orderId, Long.parseLong(req.getStationId()),
                session.getStationName(), 0L, req.getDeviceCode(), Integer.parseInt(req.getConnectorId()), userId));

        return session;
    }

    @Override
    public ChargingSessionVO stop(String orderId, Long userId) {
        ChargingSessionVO session = sessions.get(orderId);
        if (session == null) {
            // 没有活跃会话，返回已完成状态
            return ChargingSessionVO.builder()
                    .orderId(orderId).status("completed").currentSoc(75)
                    .power(0L).energy(45500L).duration(5400L).cost(7735L)
                    .stationName("充电站").deviceCode("DEV-001")
                    .startTime(Instant.now().minusSeconds(5400).toString()).build();
        }
        // 停止充电，保留最终数据
        long finalEnergy = session.getEnergy();
        long finalCost = finalEnergy * 175 / 1000; // Wh * 1.75元/kWh = 分
        ChargingSessionVO stopped = ChargingSessionVO.builder()
                .orderId(session.getOrderId()).stationName(session.getStationName())
                .deviceCode(session.getDeviceCode()).status("completed")
                .currentSoc(session.getCurrentSoc()).power(0L)
                .energy(finalEnergy).duration(session.getDuration()).cost(finalCost)
                .startTime(session.getStartTime()).build();
        sessions.remove(orderId);
        // 清除用户的当前活跃会话（通过遍历找到对应的userId key）
        redisTemplate.keys(CURRENT_SESSION_KEY + "*").forEach(key -> {
            if (redisTemplate.opsForValue().get(key).equals(orderId)) {
                redisTemplate.delete(key);
            }
        });
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
                    return ChargingSessionVO.builder()
                            .orderId("current").status("idle")
                            .currentSoc(0).power(0L).energy(0L).duration(0L).cost(0L)
                            .stationName("").deviceCode("")
                            .startTime("").build();
                }
            } else {
                return ChargingSessionVO.builder()
                        .orderId("current").status("idle")
                        .currentSoc(0).power(0L).energy(0L).duration(0L).cost(0L)
                        .stationName("").deviceCode("")
                        .startTime("").build();
            }
        }
        ChargingSessionVO session = sessions.get(orderId);
        if (session == null) {
            // 没有活跃会话
            return ChargingSessionVO.builder()
                    .orderId(orderId).status("idle")
                    .currentSoc(0).power(0L).energy(0L).duration(0L).cost(0L)
                    .stationName("").deviceCode("")
                    .startTime("").build();
        }
        if (!"charging".equals(session.getStatus())) {
            return session;
        }
        // 模拟充电进度 - 平滑递增，不跳变
        int soc = session.getCurrentSoc();
        int increment = soc < 80 ? ThreadLocalRandom.current().nextInt(1, 4) : ThreadLocalRandom.current().nextInt(0, 2);
        int newSoc = Math.min(soc + increment, 100);
        long power = soc < 80 ? 90000L + ThreadLocalRandom.current().nextLong(5000L) : 45000L + ThreadLocalRandom.current().nextLong(5000L);
        long newEnergy = session.getEnergy() + power / 3600; // 每秒增加的Wh
        long newDuration = session.getDuration() + 1;

        // 成本计算: Wh * 1.75元/kWh = Wh * 175分 / 1000
        long newCost = newEnergy * 175 / 1000;
        ChargingSessionVO updated = ChargingSessionVO.builder()
                .orderId(session.getOrderId()).stationName(session.getStationName())
                .deviceCode(session.getDeviceCode()).status("charging")
                .currentSoc(newSoc).power(power).energy(newEnergy).duration(newDuration)
                .cost(newCost)
                .startTime(session.getStartTime()).build();

        // 更新session
        sessions.put(orderId, updated);
        return updated;
    }
}
