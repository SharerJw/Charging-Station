package com.ev.common.core.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 统一错误码
 */
@Getter
@AllArgsConstructor
public enum ErrorCode {

    // ========== 1xxx: 参数/认证/权限 ==========
    PARAM_ERROR(1001, "参数校验失败"),
    NOT_LOGIN(1002, "未登录或token已过期"),
    NO_PERMISSION(1003, "无权限访问"),
    TOKEN_EXPIRED(1004, "token已过期"),
    LOGIN_TOO_MANY_ATTEMPTS(1005, "登录失败次数过多，请15分钟后重试"),
    RATE_LIMIT_EXCEEDED(1006, "请求过于频繁，请稍后再试"),

    // ========== 2xxx: 充电站/设备 ==========
    STATION_NOT_FOUND(2001, "充电站不存在"),
    DEVICE_NOT_FOUND(2002, "设备不存在"),
    DEVICE_OFFLINE(2003, "设备不在线"),
    CONNECTOR_NOT_FOUND(2004, "充电枪不存在"),

    // ========== 3xxx: 订单/支付 ==========
    ORDER_STATUS_ABNORMAL(3001, "订单状态异常"),
    BALANCE_INSUFFICIENT(3002, "余额不足"),

    // ========== 9xxx: 系统 ==========
    SYSTEM_ERROR(9999, "系统繁忙，请稍后重试"),
    SERVICE_UNAVAILABLE(9998, "服务暂时不可用");

    private final int code;
    private final String message;
}
