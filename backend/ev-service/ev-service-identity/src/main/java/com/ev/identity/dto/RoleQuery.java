package com.ev.identity.dto;

import com.ev.common.core.dto.PageQuery;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 角色管理列表查询
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class RoleQuery extends PageQuery {

    /** 搜索关键词（角色名称/编码） */
    private String keyword;
}
