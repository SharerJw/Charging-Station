package com.ev.station.service;

import com.ev.common.core.result.PageResult;
import com.ev.station.dto.DeviceQuery;
import com.ev.station.dto.DeviceVO;

import java.util.List;

public interface DeviceService {
    PageResult<DeviceVO> page(DeviceQuery query);
    DeviceVO detail(Long id);
    List<DeviceVO> listByStation(Long stationId);
    void reset(Long id);
    void unlock(Long id, Integer connectorId);
}
