package com.ev.common.core.util;

import com.ev.common.core.enums.DataScope;
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

    public static Long getOrgId() {
        return TenantContext.getOrgId();
    }

    public static String getOrgName() {
        return TenantContext.getOrgName();
    }

    public static DataScope getDataScope() {
        return TenantContext.getDataScope();
    }

    public static String getRoles() {
        return TenantContext.getRoles();
    }

    public static String getPermissions() {
        return TenantContext.getPermissions();
    }

    public static String getTraceId() {
        return MDC.get("traceId");
    }
}
