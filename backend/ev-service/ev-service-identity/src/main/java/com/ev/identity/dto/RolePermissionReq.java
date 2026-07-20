package com.ev.identity.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * 角色权限分配请求
 */
@Data
public class RolePermissionReq implements Serializable {

    @NotNull(message = "权限ID列表不能为空")
    private List<Long> permissionIds;
}
