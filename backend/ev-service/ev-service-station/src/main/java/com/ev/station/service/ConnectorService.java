package com.ev.station.service;

import com.ev.station.dto.ConnectorVO;

import java.util.List;

public interface ConnectorService {
    List<ConnectorVO> listByDevice(Long deviceId);
    ConnectorVO getDetail(Long id);
    void updateStatus(Long id, String status);
}
