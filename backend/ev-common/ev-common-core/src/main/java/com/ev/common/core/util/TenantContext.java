package com.ev.common.core.util;

/**
 * 租户上下文（线程隔离）
 * 使用 InheritableThreadLocal 支持子线程继承
 */
public final class TenantContext {

    private static final InheritableThreadLocal<String> TENANT_ID = new InheritableThreadLocal<>();
    private static final InheritableThreadLocal<Long> USER_ID = new InheritableThreadLocal<>();
    private static final InheritableThreadLocal<String> USERNAME = new InheritableThreadLocal<>();

    private TenantContext() {}

    public static void setTenantId(String tenantId) {
        TENANT_ID.set(tenantId);
    }

    public static String getTenantId() {
        return TENANT_ID.get();
    }

    public static void setUserId(Long userId) {
        USER_ID.set(userId);
    }

    public static Long getUserId() {
        return USER_ID.get();
    }

    public static void setUsername(String username) {
        USERNAME.set(username);
    }

    public static String getUsername() {
        return USERNAME.get();
    }

    public static void clear() {
        TENANT_ID.remove();
        USER_ID.remove();
        USERNAME.remove();
    }
}
