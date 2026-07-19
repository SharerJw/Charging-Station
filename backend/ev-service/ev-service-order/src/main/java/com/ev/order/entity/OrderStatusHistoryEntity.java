package com.ev.order.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.ev.common.mybatis.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 订单状态变更历史实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("order_status_history")
public class OrderStatusHistoryEntity extends BaseEntity {
    /** 订单ID */
    private Long orderId;

    /** 原状态 */
    private String fromStatus;

    /** 新状态 */
    private String toStatus;

    /** 触发类型 */
    private String triggerType;

    /** 触发用户ID */
    private Long triggerUserId;

    /** 触发原因 */
    private String triggerReason;
}