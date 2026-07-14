package com.ev.charging.service.impl;

import com.ev.charging.dto.ChargingSessionVO;
import com.ev.charging.dto.StartChargingReq;
import com.ev.charging.event.ChargingEventPublisher;
import com.ev.charging.service.ChargingService;
import com.ev.common.core.event.ChargingStartedEvent;
import com.ev.common.core.event.ChargingStoppedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

    // In-memory charging sessions (L1简化，生产用Redis/DB)
    private final Map<String, ChargingSessionVO> sessions = new ConcurrentHashMap<>();

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

        // 发布充电开始事件
        eventPublisher.publishStarted(ChargingStartedEvent.of(orderId, Long.parseLong(req.getStationId()),
                session.getStationName(), 0L, req.getDeviceCode(), Integer.parseInt(req.getConnectorId()), userId));

        return session;
    }

    @Override
    public ChargingSessionVO stop(String orderId, Long userId) {
        ChargingSessionVO session = sessions.get(orderId);
        long energy = 45500L;
        long cost = 7735L;
        if (session == null) {
            session = ChargingSessionVO.builder()
                    .orderId(orderId).status("completed").currentSoc(75)
                    .power(0L).energy(energy).duration(5400L).cost(cost)
                    .stationName("充电站").deviceCode("DEV-001")
                    .startTime(Instant.now().minusSeconds(5400).toString()).build();
        } else {
            energy = session.getEnergy() > 0 ? session.getEnergy() : energy;
            session = ChargingSessionVO.builder()
                    .orderId(session.getOrderId()).stationName(session.getStationName())
                    .deviceCode(session.getDeviceCode()).status("completed")
                    .currentSoc(75).power(0L).energy(energy).duration(5400L).cost(cost)
                    .startTime(session.getStartTime()).build();
            sessions.remove(orderId);
        }
        log.info("停止充电: orderId={}, energy={}Wh, cost={}cents", orderId, energy, cost);

        // 发布充电结束事件
        eventPublisher.publishStopped(ChargingStoppedEvent.of(orderId, 1L, energy, cost, 5400L));

        return session;
    }

    @Override
    public ChargingSessionVO status(String orderId) {
        ChargingSessionVO session = sessions.get(orderId);
        if (session == null) {
            // 返回模拟充电中数据
            return ChargingSessionVO.builder()
                    .orderId(orderId).stationName("充电站").deviceCode("DEV-001")
                    .status("charging")
                    .currentSoc(45 + ThreadLocalRandom.current().nextInt(20))
                    .power(50000L + ThreadLocalRandom.current().nextLong(15000L))
                    .energy(15000L + ThreadLocalRandom.current().nextLong(10000L))
                    .duration(1800L + ThreadLocalRandom.current().nextLong(3600L))
                    .cost(2500L + ThreadLocalRandom.current().nextLong(2000L))
                    .startTime(Instant.now().minusSeconds(3600).toString())
                    .build();
        }
        // 模拟充电进度
        int newSoc = Math.min(session.getCurrentSoc() + ThreadLocalRandom.current().nextInt(1, 5), 100);
        long newEnergy = session.getEnergy() + ThreadLocalRandom.current().nextLong(100, 500);
        long newDuration = session.getDuration() + 5;
        return ChargingSessionVO.builder()
                .orderId(session.getOrderId()).stationName(session.getStationName())
                .deviceCode(session.getDeviceCode()).status("charging")
                .currentSoc(newSoc)
                .power(90000L + ThreadLocalRandom.current().nextLong(10000L))
                .energy(newEnergy).duration(newDuration)
                .cost(newEnergy * 175 / 1000) // 约1.75元/kWh
                .startTime(session.getStartTime())
                .build();
    }
}
