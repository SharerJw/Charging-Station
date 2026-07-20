package com.ev.identity.dto;

import com.ev.common.core.dto.PageQuery;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 权限管理列表查询
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class PermissionQuery extends PageQuery {

    /** 搜索关键词（权限名称/编码） */
    private String keyword;

    /** 权限类型：MENU / BUTTON / API */
    private String type;

    /** 状态：1=启用 0=禁用 */
    private Integer status;
}
