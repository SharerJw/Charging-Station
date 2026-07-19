package com.ev.order.statemachine.handler;

import com.ev.order.entity.ChargingOrderEntity;
import com.ev.order.statemachine.OrderEvent;
import com.ev.order.statemachine.OrderStateHandler;
import com.ev.order.statemachine.OrderStatus;
import lombok.extern.slf4j.Slf4j;

import java.util.EnumMap;
import java.util.Map;

/**
 * 基础状态处理器（模板方法模式）
 * 提供通用的状态转换映射和日志记录，子类只需定义转换规则和业务逻辑
 */
@Slf4j
public abstract class AbstractOrderStateHandler implements OrderStateHandler {

    private final Map<OrderEvent, OrderStatus> eventTransitions = new EnumMap<>(OrderEvent.class);

    protected AbstractOrderStateHandler() {
        initTransitions(eventTransitions);
    }

    /**
     * 子类实现：注册事件转换映射
     * @param transitions 转换映射表
     */
    protected abstract void initTransitions(Map<OrderEvent, OrderStatus> transitions);

    @Override
    public OrderStatus handle(OrderEvent event) {
        return eventTransitions.get(event);
    }

    @Override
    public void onEnter(ChargingOrderEntity order) {
        log.info("订单进入[{}]状态: orderId={}", getStatus().getDescription(), order.getId());
        doOnEnter(order);
    }

    @Override
    public void onExit(ChargingOrderEntity order) {
        log.info("订单离开[{}]状态: orderId={}, status={}", getStatus().getDescription(), order.getId(), order.getStatus());
        doOnExit(order);
    }

    /**
     * 子类可覆盖：进入状态时的业务逻辑
     */
    protected void doOnEnter(ChargingOrderEntity order) {
        // 默认空实现
    }

    /**
     * 子类可覆盖：离开状态时的业务逻辑
     */
    protected void doOnExit(ChargingOrderEntity order) {
        // 默认空实现
    }

    /**
     * 校验是否可以转换到下一个状态（子类可覆盖）
     */
    protected boolean canTransition(ChargingOrderEntity order, OrderEvent event, OrderStatus nextStatus) {
        return true;
    }
}
