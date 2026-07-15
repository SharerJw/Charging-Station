package com.ev.identity.dto;

import com.ev.common.core.dto.PageQuery;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 用户管理列表查询
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class UserQuery extends PageQuery {

    /** 搜索关键词（昵称/手机号/用户名） */
    private String keyword;

    /** 用户状态：ACTIVE / DISABLED */
    private String status;
}
