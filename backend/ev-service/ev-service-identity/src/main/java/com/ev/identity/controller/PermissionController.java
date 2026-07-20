package com.ev.identity.controller;

import com.ev.common.core.result.PageResult;
import com.ev.common.core.result.R;
import com.ev.identity.dto.PermissionReq;
import com.ev.identity.dto.PermissionQuery;
import com.ev.identity.entity.SysPermission;
import com.ev.identity.service.PermissionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 权限管理
 */
@Tag(name = "权限管理")
@RestController
@RequestMapping("/api/v1/permissions")
@RequiredArgsConstructor
public class PermissionController {

    private final PermissionService permissionService;

    @Operation(summary = "权限列表（树形）")
    @GetMapping
    public R<List<SysPermission>> list() {
        return R.ok(permissionService.getPermissionTree());
    }

    @Operation(summary = "权限分页列表（平铺）")
    @GetMapping("/page")
    public R<PageResult<SysPermission>> page(@Valid PermissionQuery query) {
        return R.ok(permissionService.listPermissions(query));
    }

    @Operation(summary = "权限详情")
    @GetMapping("/{id}")
    public R<SysPermission> detail(@PathVariable Long id) {
        SysPermission perm = permissionService.getPermissionById(id);
        if (perm == null) return R.fail(4000, "权限不存在");
        return R.ok(perm);
    }

    @Operation(summary = "创建权限")
    @PostMapping
    public R<SysPermission> create(@Valid @RequestBody PermissionReq req) {
        return R.ok(permissionService.createPermission(req));
    }

    @Operation(summary = "更新权限")
    @PutMapping("/{id}")
    public R<Void> update(@PathVariable Long id, @Valid @RequestBody PermissionReq req) {
        permissionService.updatePermission(id, req);
        return R.ok();
    }

    @Operation(summary = "删除权限")
    @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable Long id) {
        permissionService.deletePermission(id);
        return R.ok();
    }
}
