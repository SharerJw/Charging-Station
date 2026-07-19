package com.ev.common.security.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 权限校验注解
 * 用于方法或类级别，校验用户是否具有指定权限
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequiresPermission {

    /**
     * 需要的权限码列表
     */
    String[] value();

    /**
     * 权限之间的逻辑关系
     * AND: 用户必须拥有所有指定权限
     * OR: 用户只需拥有任意一个指定权限
     */
    Logical logical() default Logical.AND;

    enum Logical {
        AND,
        OR
    }
}
