package com.ev.charging.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ev.charging.entity.ChargingSession;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;
import java.util.List;

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

    /**
     * 分页查询充电会话列表（支持按状态和站点筛选）
     */
    @Select("<script>" +
            "SELECT * FROM charging_session WHERE deleted = 0" +
            "<if test='status != null and status != \"\"'> AND status = #{status}</if>" +
            "<if test='stationId != null'> AND station_id = #{stationId}</if>" +
            "<if test='userId != null'> AND user_id = #{userId}</if>" +
            " ORDER BY started_at DESC" +
            "</script>")
    IPage<ChargingSession> selectSessionPage(Page<ChargingSession> page,
            @Param("status") String status,
            @Param("stationId") Long stationId,
            @Param("userId") Long userId);

    /**
     * 统计时间段内的充电会话数量
     */
    @Select("SELECT COUNT(*) FROM charging_session WHERE deleted = 0 AND started_at >= #{startDate} AND started_at &lt; #{endDate}")
    long countByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    /**
     * 统计时间段内已完成会话数量
     */
    @Select("SELECT COUNT(*) FROM charging_session WHERE deleted = 0 AND status = 'COMPLETED' AND started_at >= #{startDate} AND started_at &lt; #{endDate}")
    long countCompletedByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    /**
     * 统计时间段内总充电量（Wh）
     */
    @Select("SELECT COALESCE(SUM(energy_wh), 0) FROM charging_session WHERE deleted = 0 AND started_at >= #{startDate} AND started_at &lt; #{endDate}")
    long sumEnergyByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    /**
     * 统计时间段内总费用（分）
     */
    @Select("SELECT COALESCE(SUM(cost_cents), 0) FROM charging_session WHERE deleted = 0 AND started_at >= #{startDate} AND started_at &lt; #{endDate}")
    long sumCostByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    /**
     * 统计时间段内总充电时长（秒）
     */
    @Select("SELECT COALESCE(SUM(duration_sec), 0) FROM charging_session WHERE deleted = 0 AND started_at >= #{startDate} AND started_at &lt; #{endDate}")
    long sumDurationByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    /**
     * 统计指定站点时间段内的充电会话数量
     */
    @Select("SELECT COUNT(*) FROM charging_session WHERE deleted = 0 AND station_id = #{stationId} AND started_at >= #{startDate} AND started_at &lt; #{endDate}")
    long countByStationAndDateRange(@Param("stationId") Long stationId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    /**
     * 统计指定站点时间段内已完成会话数量
     */
    @Select("SELECT COUNT(*) FROM charging_session WHERE deleted = 0 AND status = 'COMPLETED' AND station_id = #{stationId} AND started_at >= #{startDate} AND started_at &lt; #{endDate}")
    long countCompletedByStationAndDateRange(@Param("stationId") Long stationId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    /**
     * 统计指定站点时间段内总充电量
     */
    @Select("SELECT COALESCE(SUM(energy_wh), 0) FROM charging_session WHERE deleted = 0 AND station_id = #{stationId} AND started_at >= #{startDate} AND started_at &lt; #{endDate}")
    long sumEnergyByStationAndDateRange(@Param("stationId") Long stationId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    /**
     * 统计指定站点时间段内总费用
     */
    @Select("SELECT COALESCE(SUM(cost_cents), 0) FROM charging_session WHERE deleted = 0 AND station_id = #{stationId} AND started_at >= #{startDate} AND started_at &lt; #{endDate}")
    long sumCostByStationAndDateRange(@Param("stationId") Long stationId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    /**
     * 统计指定站点时间段内总充电时长
     */
    @Select("SELECT COALESCE(SUM(duration_sec), 0) FROM charging_session WHERE deleted = 0 AND station_id = #{stationId} AND started_at >= #{startDate} AND started_at &lt; #{endDate}")
    long sumDurationByStationAndDateRange(@Param("stationId") Long stationId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}
