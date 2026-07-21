package com.ev.order.statemachine;

import com.ev.common.core.exception.BizException;
import com.ev.order.entity.ChargingOrderEntity;
import com.ev.order.entity.OrderStatusHistoryEntity;
import com.ev.order.mapper.OrderStatusHistoryMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/**
 * 订单状态机引擎
 * 核心组件，负责订单状态的合法转换和状态变更历史记录
 */
@Slf4j
@Component
public class OrderStateMachine {

    private final Map<OrderStatus, OrderStateHandler> handlers = new EnumMap<>(OrderStatus.class);
    private final OrderStatusHistoryMapper statusHistoryMapper;

    /**
     * 通过Spring注入所有状态处理器，自动构建handler映射
     */
    public OrderStateMachine(List<OrderStateHandler> stateHandlerList, OrderStatusHistoryMapper statusHistoryMapper) {
        this.statusHistoryMapper = statusHistoryMapper;
        for (OrderStateHandler handler : stateHandlerList) {
            handlers.put(handler.getStatus(), handler);
        }
        log.info("订单状态机初始化完成，已注册{}个状态处理器", handlers.size());
    }

    /**
     * 触发事件，执行状态转换
     * @param order 订单实体
     * @param event 触发事件
     * @return 转换后的状态
     * @throws BizException 如果状态转换非法
     */
    public OrderStatus fire(ChargingOrderEntity order, OrderEvent event) {
        return fire(order, event, null);
    }

    /**
     * 触发事件，执行状态转换（带上下文）
     * @param order 订单实体
     * @param event 触发事件
     * @param context 转换上下文（可选）
     * @return 转换后的状态
     * @throws BizException 如果状态转换非法
     */
    public synchronized OrderStatus fire(ChargingOrderEntity order, OrderEvent event, OrderContext context) {
        OrderStatus currentStatus = OrderStatus.valueOf(order.getStatus());
        OrderStateHandler handler = handlers.get(currentStatus);

        if (handler == null) {
            log.error("未找到状态处理器: status={}", currentStatus);
            throw BizException.orderStatusAbnormal();
        }

        OrderStatus nextStatus = handler.handle(event);
        if (nextStatus == null) {
            log.error("非法状态转换: currentStatus={}, event={}", currentStatus, event);
            throw BizException.orderStatusAbnormal();
        }

        log.info("订单状态转换: orderId={}, {} -> {}, event={}",
                order.getId(), currentStatus, nextStatus, event);

        // 执行状态转换
        handler.onExit(order);
        order.setStatus(nextStatus.name());
        handlers.get(nextStatus).onEnter(order);

        // 记录状态变更历史
        String triggerType = context != null ? context.getTriggerType() : event.name();
        Long triggerUserId = context != null ? context.getTriggerUserId() : null;
        String triggerReason = context != null ? context.getTriggerReason() : null;
        recordStatusHistory(order.getId(), currentStatus, nextStatus, triggerType, triggerUserId, triggerReason);

        return nextStatus;
    }

    /**
     * 记录状态变更历史
     * @param orderId 订单ID
     * @param fromStatus 原状态
     * @param toStatus 新状态
     * @param triggerType 触发类型
     * @param triggerUserId 触发用户ID
     * @param triggerReason 触发原因
     */
    private void recordStatusHistory(Long orderId, OrderStatus fromStatus, OrderStatus toStatus,
                                     String triggerType, Long triggerUserId, String triggerReason) {
        try {
            OrderStatusHistoryEntity history = new OrderStatusHistoryEntity();
            history.setOrderId(orderId);
            history.setFromStatus(fromStatus != null ? fromStatus.name() : null);
            history.setToStatus(toStatus.name());
            history.setTriggerType(triggerType);
            history.setTriggerUserId(triggerUserId);
            history.setTriggerReason(triggerReason);
            statusHistoryMapper.insert(history);
        } catch (Exception e) {
            // 记录状态历史失败不应该影响主业务流程
            log.error("记录状态变更历史失败: orderId={}, error={}", orderId, e.getMessage());
        }
    }

    /**
     * 获取指定状态的处理器
     * @param status 订单状态
     * @return 状态处理器
     */
    public OrderStateHandler getHandler(OrderStatus status) {
        return handlers.get(status);
    }

    /**
     * 检查状态转换是否合法
     * @param currentStatus 当前状态
     * @param event 触发事件
     * @return 是否合法
     */
    public boolean isValidTransition(OrderStatus currentStatus, OrderEvent event) {
        OrderStateHandler handler = handlers.get(currentStatus);
        if (handler == null) {
            return false;
        }
        return handler.handle(event) != null;
    }
}