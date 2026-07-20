package com.ev.identity.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ev.common.core.result.PageResult;
import com.ev.identity.dto.RolePermissionReq;
import com.ev.identity.dto.RoleQuery;
import com.ev.identity.dto.RoleReq;
import com.ev.identity.entity.SysPermission;
import com.ev.identity.entity.SysRole;
import com.ev.identity.entity.SysRolePermission;
import com.ev.identity.mapper.SysPermissionMapper;
import com.ev.identity.mapper.SysRoleMapper;
import com.ev.identity.mapper.SysRolePermissionMapper;
import com.ev.identity.service.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 角色管理服务实现
 */
@Service
@RequiredArgsConstructor
public class RoleServiceImpl implements RoleService {

    private final SysRoleMapper roleMapper;
    private final SysRolePermissionMapper rolePermissionMapper;
    private final SysPermissionMapper permissionMapper;

    @Override
    public PageResult<SysRole> listRoles(RoleQuery query) {
        LambdaQueryWrapper<SysRole> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(query.getKeyword())) {
            wrapper.and(w -> w.like(SysRole::getName, query.getKeyword())
                    .or().like(SysRole::getCode, query.getKeyword()));
        }
        wrapper.orderByAsc(SysRole::getCode);

        Page<SysRole> result = roleMapper.selectPage(
                new Page<>(query.getPage(), query.getSize()), wrapper);
        return PageResult.of(result.getRecords(), result.getTotal(),
                query.getPage(), query.getSize());
    }

    @Override
    public SysRole getRoleById(Long id) {
        return roleMapper.selectById(id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public SysRole createRole(RoleReq req) {
        SysRole role = new SysRole();
        role.setCode(req.getCode());
        role.setName(req.getName());
        roleMapper.insert(role);
        return role;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateRole(Long id, RoleReq req) {
        SysRole existing = roleMapper.selectById(id);
        if (existing == null) {
            throw new RuntimeException("角色不存在");
        }
        existing.setCode(req.getCode());
        existing.setName(req.getName());
        roleMapper.updateById(existing);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteRole(Long id) {
        SysRole existing = roleMapper.selectById(id);
        if (existing == null) {
            throw new RuntimeException("角色不存在");
        }
        roleMapper.deleteById(id);
        // 同时删除角色-权限关联
        LambdaQueryWrapper<SysRolePermission> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysRolePermission::getRoleId, id);
        rolePermissionMapper.delete(wrapper);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void assignPermissions(Long roleId, RolePermissionReq req) {
        SysRole existing = roleMapper.selectById(roleId);
        if (existing == null) {
            throw new RuntimeException("角色不存在");
        }
        // 先删除旧的关联
        LambdaQueryWrapper<SysRolePermission> deleteWrapper = new LambdaQueryWrapper<>();
        deleteWrapper.eq(SysRolePermission::getRoleId, roleId);
        rolePermissionMapper.delete(deleteWrapper);
        // 再批量插入新的关联
        for (Long permissionId : req.getPermissionIds()) {
            SysRolePermission rp = new SysRolePermission();
            rp.setRoleId(roleId);
            rp.setPermissionId(permissionId);
            rolePermissionMapper.insert(rp);
        }
    }

    @Override
    public List<SysPermission> getRolePermissions(Long roleId) {
        LambdaQueryWrapper<SysRolePermission> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysRolePermission::getRoleId, roleId);
        List<SysRolePermission> relations = rolePermissionMapper.selectList(wrapper);
        if (relations.isEmpty()) {
            return Collections.emptyList();
        }
        List<Long> permIds = relations.stream()
                .map(SysRolePermission::getPermissionId)
                .collect(Collectors.toList());
        return permissionMapper.selectBatchIds(permIds);
    }
}
