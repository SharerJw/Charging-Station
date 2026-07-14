package com.ev.common.core.result;

import lombok.Data;

import java.io.Serializable;

/**
 * 统一响应包装
 */
@Data
public class R<T> implements Serializable {

    private static final long serialVersionUID = 1L;

    /** 状态码：0=成功，非0=失败 */
    private int code;

    /** 提示信息 */
    private String message;

    /** 响应数据 */
    private T data;

    /** 链路追踪ID */
    private String traceId;

    public R() {}

    public R(int code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }

    public static <T> R<T> ok() {
        return new R<>(0, "success", null);
    }

    public static <T> R<T> ok(T data) {
        return new R<>(0, "success", data);
    }

    public static <T> R<T> ok(String message, T data) {
        return new R<>(0, message, data);
    }

    public static <T> R<T> fail(int code, String message) {
        return new R<>(code, message, null);
    }

    public static <T> R<T> fail(String message) {
        return new R<>(9999, message, null);
    }

    public boolean isSuccess() {
        return this.code == 0;
    }
}
