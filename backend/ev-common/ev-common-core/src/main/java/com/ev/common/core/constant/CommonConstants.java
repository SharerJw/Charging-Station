package com.ev.common.core.constant;

/**
 * 通用常量
 */
public final class CommonConstants {

    private CommonConstants() {}

    /** 请求头：用户ID */
    public static final String HEADER_USER_ID = "X-User-Id";

    /** 请求头：用户名 */
    public static final String HEADER_USERNAME = "X-Username";

    /** 请求头：用户角色 */
    public static final String HEADER_ROLES = "X-Roles";

    /** 请求头：租户ID */
    public static final String HEADER_TENANT_ID = "X-Tenant-Id";

    /** 请求头：组织ID */
    public static final String HEADER_ORG_ID = "X-Org-Id";

    /** 请求头：TraceId */
    public static final String HEADER_TRACE_ID = "X-Trace-Id";

    /** 请求头：幂等性Key */
    public static final String HEADER_IDEMPOTENCY_KEY = "Idempotency-Key";

    /** 成功状态码 */
    public static final int SUCCESS_CODE = 0;

    /** 默认租户ID */
    public static final String DEFAULT_TENANT_ID = "T001";
}
