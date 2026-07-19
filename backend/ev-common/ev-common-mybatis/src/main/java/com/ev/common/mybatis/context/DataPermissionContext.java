package com.ev.common.mybatis.context;

import com.ev.common.core.enums.DataScope;
import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * 数据权限上下文
 * 封装当前用户的数据权限信息，供拦截器和业务层使用
 */
@Data
@Builder
public class DataPermissionContext {

    /** 当前用户ID */
    private Long userId;

    /** 当前租户ID */
    private String tenantId;

    /** 当前机构ID */
    private Long orgId;

    /** 数据权限范围 */
    private DataScope dataScope;

    /** 允许访问的机构ID列表 */
    private List<Long> allowedOrgIds;

    /** 是否超级管理员（不受权限限制） */
    private boolean superAdmin;

    /**
     * 是否需要过滤
     */
    public boolean needFilter() {
        return !superAdmin && dataScope != null && dataScope != DataScope.ALL;
    }

    /**
     * 从 TenantContext 构建上下文
     */
    public static DataPermissionContext fromTenantContext() {
        return DataPermissionContext.builder()
                .userId(com.ev.common.core.util.TenantContext.getUserId())
                .tenantId(com.ev.common.core.util.TenantContext.getTenantId())
                .orgId(com.ev.common.core.util.TenantContext.getOrgId())
                .dataScope(com.ev.common.core.util.TenantContext.getDataScope())
                .build();
    }
}
