package com.ev.simulator.service.impl;

import com.ev.common.core.exception.BizException;
import com.ev.simulator.dto.SimDeviceVO;
import com.ev.simulator.service.SimulatorDeviceService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

@Slf4j
@Service
public class SimulatorDeviceServiceImpl implements SimulatorDeviceService {

    private final Map<String, SimDeviceVO> devices = new ConcurrentHashMap<>();

    public SimulatorDeviceServiceImpl() {
        // 预置虚拟设备
        addDevice("CP001", "1号直流快充桩", "DC-120kW");
        addDevice("CP002", "2号直流快充桩", "DC-120kW");
        addDevice("CP003", "3号交流慢充桩", "AC-7kW");
        addDevice("CP004", "4号超充桩", "DC-240kW");
        addDevice("CP005", "5号直流桩", "DC-60kW");
        addDevice("CP006", "6号交流桩", "AC-22kW");
        addDevice("CP007", "7号直流快充桩", "DC-120kW");
        addDevice("CP008", "8号超充桩", "DC-360kW");
    }

    private void addDevice(String ocppId, String name, String model) {
        SimDeviceVO device = SimDeviceVO.builder()
                .id(ocppId).name(name).ocppId(ocppId).model(model)
                .status(ThreadLocalRandom.current().nextBoolean() ? "online" : "offline")
                .power(0L).voltage(0L).current(0L)
                .soc(0).temperature(25 + ThreadLocalRandom.current().nextInt(15))
                .lastHeartbeat(Instant.now().toString())
                .build();
        devices.put(ocppId, device);
    }

    @Override
    public List<SimDeviceVO> list() {
        return new ArrayList<>(devices.values());
    }

    @Override
    public SimDeviceVO getById(String id) {
        SimDeviceVO device = devices.get(id);
        if (device == null) {
            throw new BizException(404, "设备不存在: " + id);
        }
        return device;
    }

    @Override
    public SimDeviceVO create(SimDeviceVO device) {
        devices.put(device.getOcppId(), device);
        return device;
    }

    @Override
    public void delete(String id) {
        devices.remove(id);
    }

    @Override
    public void reset(String id) {
        SimDeviceVO device = devices.get(id);
        if (device != null) {
            devices.put(id, SimDeviceVO.builder()
                    .id(device.getId()).name(device.getName()).ocppId(device.getOcppId())
                    .model(device.getModel()).status("online")
                    .power(0L).voltage(0L).current(0L).soc(0).temperature(25)
                    .lastHeartbeat(Instant.now().toString())
                    .build());
        }
    }

    @Override
    public SimDeviceVO heartbeat(String id) {
        SimDeviceVO device = devices.get(id);
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
        SimDeviceVO device = devices.get(id);
        if (device == null) {
            // 自动创建设备用于启动通知
            addDevice(id, "模拟设备-" + id, "DC-120kW");
            device = devices.get(id);
        }
        device.setStatus("online");
        device.setLastHeartbeat(Instant.now().toString());
        log.info("设备启动通知: id={}", id);
        return device;
    }

    @Override
    public SimDeviceVO updateStatus(String id, String status) {
        SimDeviceVO device = devices.get(id);
        if (device == null) {
            throw new BizException(404, "设备不存在: " + id);
        }
        device.setStatus(status);
        log.info("设备状态更新: id={}, status={}", id, status);
        return device;
    }
}
