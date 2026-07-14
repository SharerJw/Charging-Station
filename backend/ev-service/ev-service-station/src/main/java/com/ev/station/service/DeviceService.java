package com.ev.station.service;
import com.ev.common.core.result.PageResult;
import com.ev.station.dto.DeviceVO;
import java.util.List;

public interface DeviceService {
    PageResult<DeviceVO> page(int page, int size, String keyword, Long stationId, String status);
    DeviceVO detail(Long id);
    List<DeviceVO> listByStation(Long stationId);
    void reset(Long id);
    void unlock(Long id, Integer connectorId);
}
