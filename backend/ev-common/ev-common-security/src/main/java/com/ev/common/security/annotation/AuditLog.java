package com.ev.common.security.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 审计日志注解
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface AuditLog {

    /** 操作类型：CREATE/UPDATE/DELETE/LOGIN/LOGOUT/EXPORT */
    String action();

    /** 资源类型：station/device/order/user */
    String resource();

    /** 资源ID (SpEL表达式) */
    String resourceId() default "";
}
