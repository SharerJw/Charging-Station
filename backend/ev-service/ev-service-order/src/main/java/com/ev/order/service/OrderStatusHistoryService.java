package com.ev.order.service;

import com.ev.order.entity.OrderStatusHistoryEntity;
import com.ev.order.mapper.OrderStatusHistoryMapper;
import com.ev.order.statemachine.OrderContext;
import com.ev.order.statemachine.OrderStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 订单状态变更历史服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderStatusHistoryService {

    private final OrderStatusHistoryMapper historyMapper;

    /**
     * 记录状态变更
     */
    @Transactional
    public void recordStatusChange(Long orderId, OrderStatus fromStatus, OrderStatus toStatus,
                                   OrderContext context) {
        OrderStatusHistoryEntity history = new OrderStatusHistoryEntity();
        history.setOrderId(orderId);
        history.setFromStatus(fromStatus != null ? fromStatus.name() : null);
        history.setToStatus(toStatus.name());

        if (context != null) {
            history.setTriggerType(context.getTriggerType());
            history.setTriggerUserId(context.getTriggerUserId());
            history.setTriggerReason(context.getTriggerReason());
        }

        historyMapper.insert(history);
        log.debug("记录状态变更: orderId={}, {} -> {}", orderId,
                fromStatus != null ? fromStatus.name() : "null", toStatus.name());
    }

    /**
     * 记录状态变更（兼容旧接口）
     */
    @Transactional
    public void recordStatusChange(Long orderId, OrderStatus fromStatus, OrderStatus toStatus,
                                   String triggerType, Long triggerUserId, String triggerReason) {
        OrderStatusHistoryEntity history = new OrderStatusHistoryEntity();
        history.setOrderId(orderId);
        history.setFromStatus(fromStatus != null ? fromStatus.name() : null);
        history.setToStatus(toStatus.name());
        history.setTriggerType(triggerType);
        history.setTriggerUserId(triggerUserId);
        history.setTriggerReason(triggerReason);

        historyMapper.insert(history);
        log.debug("记录状态变更: orderId={}, {} -> {}", orderId,
                fromStatus != null ? fromStatus.name() : "null", toStatus.name());
    }

    /**
     * 查询订单状态变更历史
     */
    public List<OrderStatusHistoryEntity> getOrderHistory(Long orderId) {
        return historyMapper.selectList(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<OrderStatusHistoryEntity>()
                        .eq(OrderStatusHistoryEntity::getOrderId, orderId)
                        .orderByAsc(OrderStatusHistoryEntity::getCreatedAt)
        );
    }
}
