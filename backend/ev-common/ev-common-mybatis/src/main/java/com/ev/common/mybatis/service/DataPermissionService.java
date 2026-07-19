package com.ev.common.mybatis.service;

import com.ev.common.mybatis.context.DataPermissionContext;

/**
 * 数据权限服务接口
 * 提供数据权限上下文的获取和查询能力
 */
public interface DataPermissionService {

    /**
     * 获取当前用户的数据权限上下文
     * @return 数据权限上下文，未登录返回 null
     */
    DataPermissionContext getContext();

    /**
     * 检查指定用户是否为超级管理员
     * @param userId 用户ID
     * @return 是否超级管理员
     */
    boolean isSuperAdmin(Long userId);
}
