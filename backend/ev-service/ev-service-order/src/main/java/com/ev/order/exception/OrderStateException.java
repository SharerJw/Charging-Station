package com.ev.order.exception;

import com.ev.common.core.exception.BizException;
import com.ev.common.core.exception.ErrorCode;

/**
 * 订单状态异常
 * 用于状态机非法转换等场景
 */
public class OrderStateException extends BizException {

    public OrderStateException(String message) {
        super(ErrorCode.ORDER_STATUS_ABNORMAL.getCode(), message);
    }

    public OrderStateException(int code, String message) {
        super(code, message);
    }

    /**
     * 非法状态转换
     */
    public static OrderStateException illegalTransition(String from, String to, String event) {
        return new OrderStateException(
                String.format("不允许的状态转换: %s -> %s (event: %s)", from, to, event)
        );
    }

    /**
     * 未知状态
     */
    public static OrderStateException unknownStatus(String status) {
        return new OrderStateException("未知的订单状态: " + status);
    }

    /**
     * 不支持的事件
     */
    public static OrderStateException unsupportedEvent(String status, String event) {
        return new OrderStateException(
                String.format("状态 %s 不支持事件 %s", status, event)
        );
    }
}
