package com.ev.charging.service;

import com.ev.charging.dto.ChargingSessionVO;
import com.ev.charging.dto.ChargingStatsVO;
import com.ev.charging.dto.StartChargingReq;
import com.ev.common.core.result.PageResult;

import java.time.LocalDateTime;

public interface ChargingService {
    ChargingSessionVO start(StartChargingReq req, Long userId);
    ChargingSessionVO stop(String orderId, Long userId);
    ChargingSessionVO status(String orderId);

    /**
     * 分页查询充电会话列表
     */
    PageResult<ChargingSessionVO> listSessions(int page, int size, String status, Long stationId, Long userId);

    /**
     * 查询充电会话详情
     */
    ChargingSessionVO getSessionDetail(String sessionId);

    /**
     * 充电统计
     */
    ChargingStatsVO getStats(LocalDateTime startDate, LocalDateTime endDate, Long stationId);

    /**
     * 用户充电历史（分页）
     */
    PageResult<ChargingSessionVO> getUserHistory(Long userId, int page, int size);
}
