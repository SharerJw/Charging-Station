package com.ev.simulator.service.impl;

import com.ev.common.core.exception.BizException;
import com.ev.simulator.dto.SimDeviceVO;
import com.ev.simulator.service.SimulatorDeviceService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

@Slf4j
@Service
public class SimulatorDeviceServiceImpl implements SimulatorDeviceService {

    private final Map<String, SimDeviceVO> simulatorState = new ConcurrentHashMap<>();
    private final RestTemplate restTemplate = new RestTemplate();

    // 从 station-service 获取设备列表（带缓存）
    private List<Map<String, Object>> cachedDevices = null;
    private long lastFetchTime = 0;
    private static final long CACHE_TTL = 30_000; // 30秒缓存

    @Override
    public List<SimDeviceVO> list() {
        List<SimDeviceVO> result = new ArrayList<>();

        try {
            // 从 station-service 获取设备列表
            List<Map<String, Object>> stationDevices = fetchStationDevices();

            for (Map<String, Object> device : stationDevices) {
                String deviceId = String.valueOf(device.get("id"));
                String ocppId = (String) device.get("ocppId");
                String name = (String) device.get("name");
                String model = (String) device.get("model");
                String status = (String) device.get("status");

                // 获取或创建模拟器状态
                SimDeviceVO simDevice = simulatorState.computeIfAbsent(ocppId, k ->
                    SimDeviceVO.builder()
                        .id(ocppId)
                        .name(name)
                        .ocppId(ocppId)
                        .model(model)
                        .status(mapStatus(status))
                        .power(0L)
                        .voltage(0L)
                        .current(0L)
                        .soc(0)
                        .temperature(25 + ThreadLocalRandom.current().nextInt(15))
                        .lastHeartbeat(Instant.now().toString())
                        .build()
                );

                // 更新基本信息（确保与 station-service 同步）
                simDevice.setName(name);
                simDevice.setModel(model);

                result.add(simDevice);
            }
        } catch (Exception e) {
            log.warn("从 station-service 获取设备失败，使用本地缓存: {}", e.getMessage());
            result.addAll(simulatorState.values());
        }

        return result;
    }

    @Override
    public SimDeviceVO getById(String id) {
        SimDeviceVO device = simulatorState.get(id);
        if (device == null) {
            throw new BizException(404, "设备不存在: " + id);
        }
        return device;
    }

    @Override
    public SimDeviceVO create(SimDeviceVO device) {
        simulatorState.put(device.getOcppId(), device);
        return device;
    }

    @Override
    public void delete(String id) {
        simulatorState.remove(id);
    }

    @Override
    public void reset(String id) {
        SimDeviceVO device = simulatorState.get(id);
        if (device != null) {
            simulatorState.put(id, SimDeviceVO.builder()
                    .id(device.getId()).name(device.getName()).ocppId(device.getOcppId())
                    .model(device.getModel()).status("online")
                    .power(0L).voltage(0L).current(0L).soc(0).temperature(25)
                    .lastHeartbeat(Instant.now().toString())
                    .build());
        }
    }

    @Override
    public SimDeviceVO heartbeat(String id) {
        SimDeviceVO device = simulatorState.get(id);
        if (device == null) {
            throw new BizException(404, "设备不存在: " + id);
        }
        device.setLastHeartbeat(Instant.now().toString());
        device.setStatus("online");
        log.info("设备心跳: id={}", id);
        return device;
    }

    @Override
    public SimDeviceVO boot(String id) {
        SimDeviceVO device = simulatorState.get(id);
        if (device == null) {
            addDevice(id, "模拟设备-" + id, "DC-120kW");
            device = simulatorState.get(id);
        }
        device.setStatus("online");
        device.setLastHeartbeat(Instant.now().toString());
        log.info("设备启动通知: id={}", id);
        return device;
    }

    @Override
    public SimDeviceVO updateStatus(String id, String status) {
        SimDeviceVO device = simulatorState.get(id);
        if (device == null) {
            throw new BizException(404, "设备不存在: " + id);
        }
        device.setStatus(status);
        log.info("设备状态更新: id={}, status={}", id, status);
        return device;
    }

    private void addDevice(String ocppId, String name, String model) {
        SimDeviceVO device = SimDeviceVO.builder()
                .id(ocppId).name(name).ocppId(ocppId).model(model)
                .status(ThreadLocalRandom.current().nextBoolean() ? "online" : "offline")
                .power(0L).voltage(0L).current(0L)
                .soc(0).temperature(25 + ThreadLocalRandom.current().nextInt(15))
                .lastHeartbeat(Instant.now().toString())
                .build();
        simulatorState.put(ocppId, device);
    }

    private List<Map<String, Object>> fetchStationDevices() {
        long now = System.currentTimeMillis();
        if (cachedDevices != null && (now - lastFetchTime) < CACHE_TTL) {
            return cachedDevices;
        }

        // 从 station-service 获取设备（使用内部 API）
        String url = "http://localhost:8082/internal/devices?limit=100";
        try {
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response != null && response.containsKey("data")) {
                cachedDevices = (List<Map<String, Object>>) response.get("data");
                lastFetchTime = now;
                log.info("从 station-service 获取 {} 个设备", cachedDevices.size());
                return cachedDevices;
            }
        } catch (Exception e) {
            log.warn("获取 station-service 设备失败: {}", e.getMessage());
        }

        return cachedDevices != null ? cachedDevices : Collections.emptyList();
    }

    private String mapStatus(String stationStatus) {
        if (stationStatus == null) return "offline";
        return switch (stationStatus) {
            case "ONLINE" -> "online";
            case "CHARGING" -> "charging";
            case "FAULT" -> "fault";
            default -> "offline";
        };
    }
}
