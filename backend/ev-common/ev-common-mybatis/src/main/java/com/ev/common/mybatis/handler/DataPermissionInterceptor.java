package com.ev.common.mybatis.handler;

import com.ev.common.core.enums.DataScope;
import com.ev.common.core.util.TenantContext;
import com.ev.common.mybatis.annotation.DataPermission;
import lombok.extern.slf4j.Slf4j;
import net.sf.jsqlparser.expression.Expression;
import net.sf.jsqlparser.expression.LongValue;
import net.sf.jsqlparser.expression.Parenthesis;
import net.sf.jsqlparser.expression.operators.conditional.AndExpression;
import net.sf.jsqlparser.expression.operators.relational.EqualsTo;
import net.sf.jsqlparser.expression.operators.relational.InExpression;
import net.sf.jsqlparser.parser.CCJSqlParserUtil;
import net.sf.jsqlparser.schema.Column;
import net.sf.jsqlparser.statement.Statement;
import net.sf.jsqlparser.statement.select.PlainSelect;
import net.sf.jsqlparser.statement.select.Select;
import org.apache.ibatis.executor.statement.StatementHandler;
import org.apache.ibatis.mapping.BoundSql;
import org.apache.ibatis.mapping.MappedStatement;
import org.apache.ibatis.mapping.SqlCommandType;
import org.apache.ibatis.plugin.*;
import org.apache.ibatis.reflection.MetaObject;
import org.apache.ibatis.reflection.SystemMetaObject;

import java.lang.reflect.Method;
import java.sql.Connection;
import java.util.Properties;

/**
 * 数据权限拦截器
 * 在 SQL 执行前自动添加数据权限过滤条件
 */
@Slf4j
@Intercepts({
        @Signature(type = StatementHandler.class, method = "prepare", args = {Connection.class, Integer.class})
})
public class DataPermissionInterceptor implements Interceptor {

    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        // 获取当前用户数据权限
        DataScope dataScope = TenantContext.getDataScope();
        if (dataScope == null || dataScope == DataScope.ALL) {
            return invocation.proceed();
        }

        StatementHandler handler = (StatementHandler) invocation.getTarget();
        MetaObject metaObject = SystemMetaObject.forObject(handler);

        // 获取 MappedStatement
        MappedStatement ms = (MappedStatement) metaObject.getValue("delegate.mappedStatement");

        // 只处理 SELECT 语句
        if (ms.getSqlCommandType() != SqlCommandType.SELECT) {
            return invocation.proceed();
        }

        // 获取方法上的 @DataPermission 注解
        DataPermission annotation = getDataPermissionAnnotation(ms);
        if (annotation == null) {
            return invocation.proceed();
        }

        // 获取原始 SQL
        BoundSql boundSql = handler.getBoundSql();
        String originalSql = boundSql.getSql();

        // 根据数据权限范围修改 SQL
        String newSql = buildFilteredSql(originalSql, dataScope, annotation, boundSql);

        // 设置新的 SQL
        metaObject.setValue("delegate.boundSql.sql", newSql);
        log.debug("数据权限过滤 - 原始SQL: {}, 新SQL: {}", originalSql, newSql);

        return invocation.proceed();
    }

    /**
     * 获取方法上的 @DataPermission 注解
     */
    private DataPermission getDataPermissionAnnotation(MappedStatement ms) {
        try {
            String id = ms.getId();
            String className = id.substring(0, id.lastIndexOf("."));
            String methodName = id.substring(id.lastIndexOf(".") + 1);

            Class<?> clazz = Class.forName(className);

            // 先查方法上的注解
            for (Method method : clazz.getDeclaredMethods()) {
                if (method.getName().equals(methodName)) {
                    DataPermission methodAnnotation = method.getAnnotation(DataPermission.class);
                    if (methodAnnotation != null) {
                        return methodAnnotation;
                    }
                }
            }

            // 再查类上的注解
            return clazz.getAnnotation(DataPermission.class);
        } catch (ClassNotFoundException e) {
            log.warn("无法加载类: {}", ms.getId(), e);
            return null;
        }
    }

    /**
     * 根据数据权限范围构建过滤后的 SQL
     */
    private String buildFilteredSql(String originalSql, DataScope dataScope,
                                    DataPermission annotation, BoundSql boundSql) {
        try {
            Statement statement = CCJSqlParserUtil.parse(originalSql);
            if (!(statement instanceof Select select)) {
                return originalSql;
            }

            if (!(select.getSelectBody() instanceof PlainSelect plainSelect)) {
                return originalSql;
            }

            // 构建数据权限条件
            Expression dataPermissionCondition = buildDataPermissionCondition(dataScope, annotation);
            if (dataPermissionCondition == null) {
                return originalSql;
            }

            // 添加 WHERE 条件
            Expression where = plainSelect.getWhere();
            if (where == null) {
                plainSelect.setWhere(dataPermissionCondition);
            } else {
                plainSelect.setWhere(new AndExpression(where, new Parenthesis(dataPermissionCondition)));
            }

            return plainSelect.toString();
        } catch (Exception e) {
            log.error("SQL 解析失败，跳过数据权限过滤: {}", originalSql, e);
            return originalSql;
        }
    }

    /**
     * 构建数据权限条件
     */
    private Expression buildDataPermissionCondition(DataScope dataScope, DataPermission annotation) {
        Long userId = TenantContext.getUserId();
        Long orgId = TenantContext.getOrgId();

        if (userId == null) {
            return null;
        }

        String prefix = annotation.tableAlias().isEmpty() ? "" : annotation.tableAlias() + ".";
        Column orgColumn = new Column(prefix + annotation.orgField());
        Column createUserColumn = new Column(prefix + annotation.createUserField());

        return switch (dataScope) {
            case ALL -> null;
            case ORG_AND_CHILD -> {
                // org_id IN (SELECT id FROM sys_org WHERE id = ? OR parent_id = ?)
                if (orgId == null) {
                    yield new EqualsTo(orgColumn, new LongValue(userId));
                }
                try {
                    String subQuery = "(SELECT id FROM sys_org WHERE id = " + orgId + " OR parent_id = " + orgId + ")";
                    yield new InExpression(orgColumn, CCJSqlParserUtil.parseExpression(subQuery));
                } catch (Exception e) {
                    log.warn("构建机构子查询失败，回退到仅本机构: orgId={}", orgId, e);
                    yield new EqualsTo(orgColumn, new LongValue(orgId));
                }
            }
            case ORG_ONLY -> {
                // org_id = ?
                if (orgId == null) {
                    yield new EqualsTo(orgColumn, new LongValue(userId));
                }
                yield new EqualsTo(orgColumn, new LongValue(orgId));
            }
            case SELF_ONLY -> {
                // create_user_id = ?
                yield new EqualsTo(createUserColumn, new LongValue(userId));
            }
        };
    }

    @Override
    public Object plugin(Object target) {
        return Plugin.wrap(target, this);
    }

    @Override
    public void setProperties(Properties properties) {
        // No properties needed
    }
}
