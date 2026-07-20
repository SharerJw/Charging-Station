package com.ev.identity.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ev.common.core.result.PageResult;
import com.ev.identity.dto.PermissionReq;
import com.ev.identity.dto.PermissionQuery;
import com.ev.identity.entity.SysPermission;
import com.ev.identity.mapper.SysPermissionMapper;
import com.ev.identity.service.PermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 权限管理服务实现
 */
@Service
@RequiredArgsConstructor
public class PermissionServiceImpl implements PermissionService {

    private final SysPermissionMapper permissionMapper;

    @Override
    public PageResult<SysPermission> listPermissions(PermissionQuery query) {
        LambdaQueryWrapper<SysPermission> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(query.getKeyword())) {
            wrapper.and(w -> w.like(SysPermission::getName, query.getKeyword())
                    .or().like(SysPermission::getCode, query.getKeyword()));
        }
        if (StringUtils.hasText(query.getType())) {
            wrapper.eq(SysPermission::getType, query.getType());
        }
        if (query.getStatus() != null) {
            wrapper.eq(SysPermission::getStatus, query.getStatus());
        }
        wrapper.orderByAsc(SysPermission::getSort);

        Page<SysPermission> result = permissionMapper.selectPage(
                new Page<>(query.getPage(), query.getSize()), wrapper);
        return PageResult.of(result.getRecords(), result.getTotal(),
                query.getPage(), query.getSize());
    }

    @Override
    public List<SysPermission> getPermissionTree() {
        List<SysPermission> all = permissionMapper.selectList(
                new LambdaQueryWrapper<SysPermission>().orderByAsc(SysPermission::getSort));
        // 构建树：将平铺列表转为以 parentId 分组的 Map，再从根节点递归组装
        Map<Long, List<SysPermission>> parentMap = all.stream()
                .collect(Collectors.groupingBy(p -> p.getParentId() != null ? p.getParentId() : 0L));
        List<SysPermission> roots = parentMap.getOrDefault(0L, new ArrayList<>());
        buildChildren(roots, parentMap);
        return roots;
    }

    private void buildChildren(List<SysPermission> parents, Map<Long, List<SysPermission>> parentMap) {
        for (SysPermission parent : parents) {
            List<SysPermission> children = parentMap.getOrDefault(parent.getId(), new ArrayList<>());
            children.sort(Comparator.comparingInt(p -> p.getSort() != null ? p.getSort() : 0));
            if (!children.isEmpty()) {
                buildChildren(children, parentMap);
            }
            // SysPermission 没有 children 字段，直接返回平铺树由前端处理
        }
    }

    @Override
    public SysPermission getPermissionById(Long id) {
        return permissionMapper.selectById(id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public SysPermission createPermission(PermissionReq req) {
        SysPermission perm = new SysPermission();
        perm.setParentId(req.getParentId() != null ? req.getParentId() : 0L);
        perm.setName(req.getName());
        perm.setCode(req.getCode());
        perm.setType(req.getType());
        perm.setPath(req.getPath());
        perm.setIcon(req.getIcon());
        perm.setSort(req.getSort() != null ? req.getSort() : 0);
        perm.setStatus(req.getStatus() != null ? req.getStatus() : 1);
        permissionMapper.insert(perm);
        return perm;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updatePermission(Long id, PermissionReq req) {
        SysPermission existing = permissionMapper.selectById(id);
        if (existing == null) {
            throw new RuntimeException("权限不存在");
        }
        existing.setParentId(req.getParentId());
        existing.setName(req.getName());
        existing.setCode(req.getCode());
        existing.setType(req.getType());
        existing.setPath(req.getPath());
        existing.setIcon(req.getIcon());
        if (req.getSort() != null) existing.setSort(req.getSort());
        if (req.getStatus() != null) existing.setStatus(req.getStatus());
        permissionMapper.updateById(existing);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deletePermission(Long id) {
        SysPermission existing = permissionMapper.selectById(id);
        if (existing == null) {
            throw new RuntimeException("权限不存在");
        }
        permissionMapper.deleteById(id);
    }
}
