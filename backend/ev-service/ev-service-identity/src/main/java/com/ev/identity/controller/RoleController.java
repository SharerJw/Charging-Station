package com.ev.identity.controller;

import com.ev.common.core.result.PageResult;
import com.ev.common.core.result.R;
import com.ev.identity.dto.RolePermissionReq;
import com.ev.identity.dto.RoleQuery;
import com.ev.identity.dto.RoleReq;
import com.ev.identity.entity.SysPermission;
import com.ev.identity.entity.SysRole;
import com.ev.identity.service.RoleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 角色管理
 */
@Tag(name = "角色管理")
@RestController
@RequestMapping("/api/v1/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;

    @Operation(summary = "角色列表")
    @GetMapping
    public R<PageResult<SysRole>> list(@Valid RoleQuery query) {
        return R.ok(roleService.listRoles(query));
    }

    @Operation(summary = "角色详情")
    @GetMapping("/{id}")
    public R<SysRole> detail(@PathVariable Long id) {
        SysRole role = roleService.getRoleById(id);
        if (role == null) return R.fail(4000, "角色不存在");
        return R.ok(role);
    }

    @Operation(summary = "创建角色")
    @PostMapping
    public R<SysRole> create(@Valid @RequestBody RoleReq req) {
        return R.ok(roleService.createRole(req));
    }

    @Operation(summary = "更新角色")
    @PutMapping("/{id}")
    public R<Void> update(@PathVariable Long id, @Valid @RequestBody RoleReq req) {
        roleService.updateRole(id, req);
        return R.ok();
    }

    @Operation(summary = "删除角色")
    @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable Long id) {
        roleService.deleteRole(id);
        return R.ok();
    }

    @Operation(summary = "分配权限")
    @PostMapping("/{id}/permissions")
    public R<Void> assignPermissions(@PathVariable Long id,
                                     @Valid @RequestBody RolePermissionReq req) {
        roleService.assignPermissions(id, req);
        return R.ok();
    }

    @Operation(summary = "查看角色权限")
    @GetMapping("/{id}/permissions")
    public R<List<SysPermission>> getPermissions(@PathVariable Long id) {
        return R.ok(roleService.getRolePermissions(id));
    }
}
