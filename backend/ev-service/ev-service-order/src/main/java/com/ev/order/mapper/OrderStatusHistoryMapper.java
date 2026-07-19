package com.ev.order.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ev.order.entity.OrderStatusHistoryEntity;
import org.apache.ibatis.annotations.Mapper;

/**
 * 订单状态变更历史Mapper
 */
@Mapper
public interface OrderStatusHistoryMapper extends BaseMapper<OrderStatusHistoryEntity> {
}