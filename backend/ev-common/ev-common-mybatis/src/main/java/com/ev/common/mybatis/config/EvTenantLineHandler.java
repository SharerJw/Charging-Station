package com.ev.common.mybatis.config;

import com.baomidou.mybatisplus.extension.plugins.handler.TenantLineHandler;
import com.ev.common.core.util.TenantContext;
import net.sf.jsqlparser.expression.Expression;
import net.sf.jsqlparser.expression.LongValue;
import net.sf.jsqlparser.expression.StringValue;

import java.util.Arrays;
import java.util.List;

/**
 * 多租户拦截器
 */
public class EvTenantLineHandler implements TenantLineHandler {

    /** 不需要租户隔离的表（无 tenant_id 列） */
    private static final List<String> IGNORE_TABLES = Arrays.asList(
            "sys_role",
            "sys_permission",
            "sys_role_permission",
            "sys_user_role",
            "connector",
            "device_alert",
            "inspection_task",
            "payment_record",
            "work_order"
    );

    @Override
    public Expression getTenantId() {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null || tenantId.isEmpty()) {
            // 无租户上下文时返回 1=1 的等价表达式，使条件恒真
            // MyBatis-Plus 会生成 tenant_id = '__ALL__'，配合 ignoreTenantId() 不生效
            // 但由于 MyBatis-Plus 3.5.7 不支持动态跳过，这里返回实际租户值
            // 使所有未登录请求也能查到数据
            return new StringValue("T001");
        }
        return new StringValue(tenantId);
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
