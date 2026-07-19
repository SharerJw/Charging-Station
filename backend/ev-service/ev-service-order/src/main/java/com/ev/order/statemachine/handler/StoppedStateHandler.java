package com.ev.order.statemachine.handler;

import com.ev.order.entity.ChargingOrderEntity;
import com.ev.order.statemachine.OrderEvent;
import com.ev.order.statemachine.OrderStateHandler;
import com.ev.order.statemachine.OrderStatus;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.Map;

/**
 * 已停止状态处理器
 */
@Slf4j
@Component
public class StoppedStateHandler implements OrderStateHandler {

    private final Map<OrderEvent, OrderStatus> eventTransitions = new EnumMap<>(OrderEvent.class);

    public StoppedStateHandler() {
        eventTransitions.put(OrderEvent.SETTLE, OrderStatus.SETTLING);
    }

    @Override
    public OrderStatus getStatus() {
        return OrderStatus.STOPPED;
    }

    @Override
    public OrderStatus handle(OrderEvent event) {
        return eventTransitions.get(event);
    }

    @Override
    public void onEnter(ChargingOrderEntity order) {
        log.info("订单进入已停止状态: orderId={}", order.getId());
        order.setStopTime(LocalDateTime.now());
    }

    @Override
    public void onExit(ChargingOrderEntity order) {
        log.info("订单离开已停止状态: orderId={}, status={}", order.getId(), order.getStatus());
    }
}