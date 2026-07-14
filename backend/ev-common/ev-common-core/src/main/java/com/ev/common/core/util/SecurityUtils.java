package com.ev.common.core.util;

import org.slf4j.MDC;

/**
 * 安全工具类 - 从 TenantContext 获取当前用户信息
 */
public final class SecurityUtils {

    private SecurityUtils() {}

    public static Long getUserId() {
        return TenantContext.getUserId();
    }

    public static String getUsername() {
        return TenantContext.getUsername();
    }

    public static String getTenantId() {
        return TenantContext.getTenantId();
    }

    public static String getTraceId() {
        return MDC.get("traceId");
    }
}
