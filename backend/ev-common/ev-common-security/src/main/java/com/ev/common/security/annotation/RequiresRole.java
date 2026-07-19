package com.ev.common.security.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 角色校验注解
 * 用于方法或类级别，校验用户是否具有指定角色
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequiresRole {

    /**
     * 需要的角色码列表
     */
    String[] value();

    /**
     * 角色之间的逻辑关系
     * AND: 用户必须拥有所有指定角色
     * OR: 用户只需拥有任意一个指定角色
     */
    Logical logical() default Logical.AND;

    enum Logical {
        AND,
        OR
    }
}
