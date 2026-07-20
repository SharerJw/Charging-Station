package com.ev.charging.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 充电会话实体 - 对应 charging_session 表
 */
@Data
@TableName("charging_session")
public class ChargingSession {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 会话唯一标识（UUID） */
    private String sessionId;

    /** 关联订单号 */
    private String orderId;

    /** 用户 ID */
    private Long userId;

    /** 用户昵称 */
    private String userNickname;

    /** 充电站 ID */
    private Long stationId;

    /** 充电站名称 */
    private String stationName;

    /** 设备 ID */
    private Long deviceId;

    /** 设备编码 */
    private String deviceCode;

    /** 连接器编号 */
    private Integer connectorId;

    /** 会话状态: INITIATING/CHARGING/COMPLETED/FAILED/TIMEOUT */
    private String status;

    /** 当前 SOC（%） */
    private Integer currentSoc;

    /** 起始 SOC（%） */
    private Integer startSoc;

    /** 目标 SOC（%） */
    private Integer targetSoc;

    /** 当前功率（W） */
    private Long powerW;

    /** 累计电量（Wh） */
    private Long energyWh;

    /** 当前电压（mV） */
    private Integer voltageMv;

    /** 当前电流（mA） */
    private Integer currentMa;

    /** 充电时长（秒） */
    private Long durationSec;

    /** 累计费用（分） */
    private Long costCents;

    /** 错误码 */
    private String errorCode;

    /** 错误信息 */
    private String errorMessage;

    /** 起始电表读数（Wh） */
    private Long meterStart;

    /** 结束电表读数（Wh） */
    private Long meterStop;

    /** 租户 ID */
    private String tenantId;

    /** 会话开始时间 */
    private LocalDateTime startedAt;

    /** 会话结束时间 */
    private LocalDateTime stoppedAt;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    /** 逻辑删除 */
    private Integer deleted;
}
