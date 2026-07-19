package com.ev.order.statemachine;

import com.ev.order.entity.ChargingOrderEntity;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 订单状态转换上下文
 * 携带事件触发的元信息，用于记录审计和辅助决策
 */
@Data
@Builder
public class OrderContext {

    /** 触发事件 */
    private OrderEvent event;

    /** 触发用户ID */
    private Long triggerUserId;

    /** 触发人类型：USER, SYSTEM, DEVICE, ADMIN */
    private String triggerType;

    /** 触发原因 */
    private String triggerReason;

    /** 额外数据（JSON格式） */
    private String extraData;

    /** 事件时间 */
    @Builder.Default
    private LocalDateTime eventTime = LocalDateTime.now();

    /**
     * 便捷工厂方法 - 用户触发
     */
    public static OrderContext userTrigger(OrderEvent event, Long userId, String reason) {
        return OrderContext.builder()
                .event(event)
                .triggerUserId(userId)
                .triggerType("USER")
                .triggerReason(reason)
                .build();
    }

    /**
     * 便捷工厂方法 - 系统触发
     */
    public static OrderContext systemTrigger(OrderEvent event, String reason) {
        return OrderContext.builder()
                .event(event)
                .triggerType("SYSTEM")
                .triggerReason(reason)
                .build();
    }

    /**
     * 便捷工厂方法 - 设备触发
     */
    public static OrderContext deviceTrigger(OrderEvent event, String reason) {
        return OrderContext.builder()
                .event(event)
                .triggerType("DEVICE")
                .triggerReason(reason)
                .build();
    }
}
