package com.ev.simulator.service;

import com.ev.simulator.dto.SimDeviceVO;
import java.util.List;
import java.util.Map;

public interface SimulatorDeviceService {
    Map<String, Object> list(int page, int size, String keyword, String status);
    List<SimDeviceVO> listAll();
    SimDeviceVO getById(String id);
    SimDeviceVO create(SimDeviceVO device);
    void delete(String id);
    void reset(String id);
    SimDeviceVO heartbeat(String id);
    SimDeviceVO boot(String id);
    SimDeviceVO updateStatus(String id, String status);
}
