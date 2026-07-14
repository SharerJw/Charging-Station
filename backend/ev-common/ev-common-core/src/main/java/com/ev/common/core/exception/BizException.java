package com.ev.common.core.exception;

import lombok.Getter;

/**
 * 业务异常
 */
@Getter
public class BizException extends RuntimeException {

    private final int code;

    public BizException(int code, String message) {
        super(message);
        this.code = code;
    }

    public BizException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.code = errorCode.getCode();
    }

    // ========== 便捷工厂方法 ==========

    public static BizException of(int code, String message) {
        return new BizException(code, message);
    }

    // 认证/权限
    public static BizException notLogin() {
        return new BizException(ErrorCode.NOT_LOGIN);
    }

    public static BizException noPermission() {
        return new BizException(ErrorCode.NO_PERMISSION);
    }

    public static BizException tokenExpired() {
        return new BizException(ErrorCode.TOKEN_EXPIRED);
    }

    // 参数
    public static BizException paramError(String detail) {
        return new BizException(1001, "参数校验失败: " + detail);
    }

    public static BizException paramError() {
        return new BizException(ErrorCode.PARAM_ERROR);
    }

    // 充电站
    public static BizException stationNotFound() {
        return new BizException(ErrorCode.STATION_NOT_FOUND);
    }

    public static BizException stationDuplicateCode() {
        return new BizException(2003, "充电站编码已存在");
    }

    // 设备
    public static BizException deviceNotFound() {
        return new BizException(ErrorCode.DEVICE_NOT_FOUND);
    }

    public static BizException deviceOffline() {
        return new BizException(ErrorCode.DEVICE_OFFLINE);
    }

    // 订单
    public static BizException orderNotFound() {
        return new BizException(3000, "订单不存在");
    }

    public static BizException orderStatusAbnormal() {
        return new BizException(ErrorCode.ORDER_STATUS_ABNORMAL);
    }

    public static BizException balanceInsufficient() {
        return new BizException(ErrorCode.BALANCE_INSUFFICIENT);
    }

    public static BizException duplicateOperation() {
        return new BizException(3003, "请勿重复操作");
    }

    // 用户
    public static BizException userNotFound() {
        return new BizException(4000, "用户不存在");
    }

    public static BizException usernameExists() {
        return new BizException(4001, "用户名已存在");
    }

    public static BizException phoneExists() {
        return new BizException(4002, "手机号已注册");
    }

    public static BizException invalidSmsCode() {
        return new BizException(4003, "验证码错误或已过期");
    }

    public static BizException wrongPassword() {
        return new BizException(4004, "密码错误");
    }

    public static BizException accountDisabled() {
        return new BizException(4005, "账号已禁用");
    }
}
