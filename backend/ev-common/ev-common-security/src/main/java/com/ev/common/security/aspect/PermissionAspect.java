package com.ev.common.security.aspect;

import com.ev.common.core.exception.BizException;
import com.ev.common.core.util.TenantContext;
import com.ev.common.security.annotation.RequiresPermission;
import com.ev.common.security.annotation.RequiresRole;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

/**
 * 权限校验切面
 * 处理 @RequiresPermission 和 @RequiresRole 注解
 */
@Slf4j
@Aspect
@Component
public class PermissionAspect {

    /**
     * 处理 @RequiresPermission 注解
     */
    @Before("@annotation(requiresPermission)")
    public void checkPermission(JoinPoint joinPoint, RequiresPermission requiresPermission) {
        String[] requiredPermissions = requiresPermission.value();
        RequiresPermission.Logical logical = requiresPermission.logical();

        String permissionsStr = TenantContext.getPermissions();
        if (permissionsStr == null || permissionsStr.isEmpty()) {
            log.warn("用户没有权限信息: userId={}", TenantContext.getUserId());
            throw BizException.noPermission();
        }

        Set<String> userPermissions = new HashSet<>(Arrays.asList(permissionsStr.split(",")));
        Set<String> required = new HashSet<>(Arrays.asList(requiredPermissions));

        boolean hasPermission;
        if (logical == RequiresPermission.Logical.AND) {
            hasPermission = userPermissions.containsAll(required);
        } else {
            hasPermission = !Collections.disjoint(userPermissions, required);
        }

        if (!hasPermission) {
            log.warn("权限校验失败: userId={}, required={}, userPermissions={}",
                    TenantContext.getUserId(), required, userPermissions);
            throw BizException.noPermission();
        }
    }

    /**
     * 处理 @RequiresRole 注解
     */
    @Before("@annotation(requiresRole)")
    public void checkRole(JoinPoint joinPoint, RequiresRole requiresRole) {
        String[] requiredRoles = requiresRole.value();
        RequiresRole.Logical logical = requiresRole.logical();

        String rolesStr = TenantContext.getRoles();
        if (rolesStr == null || rolesStr.isEmpty()) {
            log.warn("用户没有角色信息: userId={}", TenantContext.getUserId());
            throw BizException.noPermission();
        }

        Set<String> userRoles = new HashSet<>(Arrays.asList(rolesStr.split(",")));
        Set<String> required = new HashSet<>(Arrays.asList(requiredRoles));

        boolean hasRole;
        if (logical == RequiresRole.Logical.AND) {
            hasRole = userRoles.containsAll(required);
        } else {
            hasRole = !Collections.disjoint(userRoles, required);
        }

        if (!hasRole) {
            log.warn("角色校验失败: userId={}, required={}, userRoles={}",
                    TenantContext.getUserId(), required, userRoles);
            throw BizException.noPermission();
        }
    }
}
