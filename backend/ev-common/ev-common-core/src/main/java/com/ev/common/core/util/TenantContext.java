package com.ev.common.core.util;

import com.ev.common.core.enums.DataScope;

/**
 * 租户上下文（线程隔离）
 * 使用 InheritableThreadLocal 支持子线程继承
 */
public final class TenantContext {

    private static final InheritableThreadLocal<String> TENANT_ID = new InheritableThreadLocal<>();
    private static final InheritableThreadLocal<Long> USER_ID = new InheritableThreadLocal<>();
    private static final InheritableThreadLocal<String> USERNAME = new InheritableThreadLocal<>();
    private static final InheritableThreadLocal<Long> ORG_ID = new InheritableThreadLocal<>();
    private static final InheritableThreadLocal<String> ORG_NAME = new InheritableThreadLocal<>();
    private static final InheritableThreadLocal<DataScope> DATA_SCOPE = new InheritableThreadLocal<>();
    private static final InheritableThreadLocal<String> ROLES = new InheritableThreadLocal<>();
    private static final InheritableThreadLocal<String> PERMISSIONS = new InheritableThreadLocal<>();

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

    public static void setOrgId(Long orgId) {
        ORG_ID.set(orgId);
    }

    public static Long getOrgId() {
        return ORG_ID.get();
    }

    public static void setOrgName(String orgName) {
        ORG_NAME.set(orgName);
    }

    public static String getOrgName() {
        return ORG_NAME.get();
    }

    public static void setDataScope(DataScope dataScope) {
        DATA_SCOPE.set(dataScope);
    }

    public static DataScope getDataScope() {
        return DATA_SCOPE.get();
    }

    public static void setRoles(String roles) {
        ROLES.set(roles);
    }

    public static String getRoles() {
        return ROLES.get();
    }

    public static void setPermissions(String permissions) {
        PERMISSIONS.set(permissions);
    }

    public static String getPermissions() {
        return PERMISSIONS.get();
    }

    public static void clear() {
        TENANT_ID.remove();
        USER_ID.remove();
        USERNAME.remove();
        ORG_ID.remove();
        ORG_NAME.remove();
        DATA_SCOPE.remove();
        ROLES.remove();
        PERMISSIONS.remove();
    }
}
