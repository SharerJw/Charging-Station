package com.ev.order.dto;

import com.ev.common.core.dto.PageQuery;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 用户端订单查询（仅 status 维度，userId 由系统从 JWT 注入）
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class UserOrderQuery extends PageQuery {

    /** 订单状态筛选 */
    private String status;
}
