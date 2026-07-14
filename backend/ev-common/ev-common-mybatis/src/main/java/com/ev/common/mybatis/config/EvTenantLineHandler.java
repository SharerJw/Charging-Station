package com.ev.common.mybatis.config;

import com.baomidou.mybatisplus.extension.plugins.handler.TenantLineHandler;
import com.ev.common.core.util.TenantContext;
import net.sf.jsqlparser.expression.Expression;
import net.sf.jsqlparser.expression.StringValue;

import java.util.Arrays;
import java.util.List;

/**
 * 多租户拦截器
 */
public class EvTenantLineHandler implements TenantLineHandler {

    /** 不需要租户隔离的表 */
    private static final List<String> IGNORE_TABLES = Arrays.asList(
            "sys_role",
            "sys_permission",
            "sys_role_permission"
    );

    @Override
    public Expression getTenantId() {
        String tenantId = TenantContext.getTenantId();
        return new StringValue(tenantId != null ? tenantId : "T001");
    }

    @Override
    public String getTenantIdColumn() {
        return "tenant_id";
    }

    @Override
    public boolean ignoreTable(String tableName) {
        return IGNORE_TABLES.contains(tableName);
    }
}
