package com.ev.order.statemachine;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 订单状态枚举
 */
@Getter
@AllArgsConstructor
public enum OrderStatus {
    CREATED("已创建"),
    CHARGING("充电中"),
    STOPPING("停止中"),
    STOPPED("已停止"),
    SETTLING("结算中"),
    SETTLED("已结算"),
    PAYING("支付中"),
    PAID("已支付"),
    REFUNDING("退款中"),
    REFUNDED("已退款"),
    CANCELLED("已取消"),
    ABNORMAL("异常");

    private final String description;
}