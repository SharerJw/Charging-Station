package com.ev.identity.service;

import com.ev.common.core.result.PageResult;
import com.ev.identity.dto.RolePermissionReq;
import com.ev.identity.dto.RoleQuery;
import com.ev.identity.dto.RoleReq;
import com.ev.identity.entity.SysPermission;
import com.ev.identity.entity.SysRole;

import java.util.List;

/**
 * 角色管理服务接口
 */
public interface RoleService {

    /**
     * 分页查询角色列表
     */
    PageResult<SysRole> listRoles(RoleQuery query);

    /**
     * 根据ID获取角色
     */
    SysRole getRoleById(Long id);

    /**
     * 创建角色
     */
    SysRole createRole(RoleReq req);

    /**
     * 更新角色
     */
    void updateRole(Long id, RoleReq req);

    /**
     * 删除角色
     */
    void deleteRole(Long id);

    /**
     * 分配权限
     */
    void assignPermissions(Long roleId, RolePermissionReq req);

    /**
     * 获取角色的权限列表
     */
    List<SysPermission> getRolePermissions(Long roleId);
}
