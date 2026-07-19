package com.ev.common.mybatis.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 数据权限注解
 * 标注在 Mapper 方法或 Service 方法上，自动添加数据权限过滤条件
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface DataPermission {

    /**
     * 表别名（用于 JOIN 查询时指定表名）
     * 例如: "u" 表示 u.org_id
     */
    String tableAlias() default "";

    /**
     * 机构ID字段名
     */
    String orgField() default "org_id";

    /**
     * 创建人字段名
     */
    String createUserField() default "create_user_id";
}
