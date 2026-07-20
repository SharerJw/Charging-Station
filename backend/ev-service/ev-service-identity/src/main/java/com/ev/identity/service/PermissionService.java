package com.ev.identity.service;

import com.ev.common.core.result.PageResult;
import com.ev.identity.dto.PermissionReq;
import com.ev.identity.dto.PermissionQuery;
import com.ev.identity.entity.SysPermission;

import java.util.List;

/**
 * 权限管理服务接口
 */
public interface PermissionService {

    /**
     * 分页查询权限列表（平铺）
     */
    PageResult<SysPermission> listPermissions(PermissionQuery query);

    /**
     * 获取权限树形结构
     */
    List<SysPermission> getPermissionTree();

    /**
     * 根据ID获取权限
     */
    SysPermission getPermissionById(Long id);

    /**
     * 创建权限
     */
    SysPermission createPermission(PermissionReq req);

    /**
     * 更新权限
     */
    void updatePermission(Long id, PermissionReq req);

    /**
     * 删除权限
     */
    void deletePermission(Long id);
}
