package com.ev.charging.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ev.charging.entity.ChargingSession;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

/**
 * 充电会话 Mapper
 */
@Mapper
public interface ChargingSessionMapper extends BaseMapper<ChargingSession> {

    /**
     * 根据 orderId 查询活跃会话
     */
    @Select("SELECT * FROM charging_session WHERE order_id = #{orderId} AND deleted = 0")
    ChargingSession selectByOrderId(@Param("orderId") String orderId);

    /**
     * 根据 sessionId 查询会话
     */
    @Select("SELECT * FROM charging_session WHERE session_id = #{sessionId} AND deleted = 0")
    ChargingSession selectBySessionId(@Param("sessionId") String sessionId);

    /**
     * 查询用户当前活跃会话
     */
    @Select("SELECT * FROM charging_session WHERE user_id = #{userId} AND status = 'CHARGING' AND deleted = 0 ORDER BY started_at DESC LIMIT 1")
    ChargingSession selectActiveByUserId(@Param("userId") Long userId);
}
