package com.ev.order.service;

import com.ev.common.core.dto.PageQuery;
import com.ev.common.core.result.PageResult;
import com.ev.order.dto.*;

public interface OrderService {

    /**
     * 分页查询订单
     * @param query 分页及筛选条件（PageQuery / OrderQuery / UserOrderQuery）
     * @param userId 当前用户ID，非 null 时强制只返回该用户的订单（水平越权防护）
     */
    PageResult<OrderVO> page(PageQuery query, Long userId);

    /**
     * 订单详情
     * @param id 订单ID
     * @param userId 当前用户ID，非 null 时校验订单归属
     */
    OrderVO detail(Long id, Long userId);

    void refund(Long id, Long amount, String reason);
}
