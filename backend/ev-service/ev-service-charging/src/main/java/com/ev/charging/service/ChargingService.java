package com.ev.charging.service;

import com.ev.charging.dto.ChargingSessionVO;
import com.ev.charging.dto.StartChargingReq;

public interface ChargingService {
    ChargingSessionVO start(StartChargingReq req, Long userId);
    ChargingSessionVO stop(String orderId, Long userId);
    ChargingSessionVO status(String orderId);
}
