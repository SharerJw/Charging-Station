package com.ev.order.service;
import com.ev.common.core.result.PageResult;
import com.ev.order.dto.*;

public interface OrderService {
    PageResult<OrderVO> page(OrderQuery query);
    OrderVO detail(Long id);
    void refund(Long id, Long amount, String reason);
}
