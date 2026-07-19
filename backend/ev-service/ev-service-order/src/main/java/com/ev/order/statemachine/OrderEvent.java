package com.ev.order.statemachine;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 订单事件枚举
 */
@Getter
@AllArgsConstructor
public enum OrderEvent {
    START_CHARGING("开始充电"),
    STOP_CHARGING("停止充电"),
    CHARGING_STOPPED("充电已停止"),
    SETTLE("开始结算"),
    SETTLED("结算完成"),
    PAY("开始支付"),
    PAID("支付完成"),
    REFUND("申请退款"),
    REFUNDED("退款完成"),
    CANCEL("取消订单"),
    ABNORMAL("异常状态");

    private final String description;
}