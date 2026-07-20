package com.ev.identity.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.io.Serializable;

/**
 * 权限创建/更新请求
 */
@Data
public class PermissionReq implements Serializable {

    /** 父级ID，顶级为0 */
    private Long parentId;

    @NotBlank(message = "权限名称不能为空")
    private String name;

    @NotBlank(message = "权限编码不能为空")
    private String code;

    /** 类型：MENU / BUTTON / API */
    @NotBlank(message = "权限类型不能为空")
    private String type;

    /** 路由路径 */
    private String path;

    /** 图标 */
    private String icon;

    /** 排序 */
    private Integer sort;

    /** 状态：1=启用 0=禁用 */
    private Integer status;
}
