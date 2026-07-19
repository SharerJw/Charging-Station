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
 * 已创建状态处理器
 */
@Slf4j
@Component
public class CreatedStateHandler implements OrderStateHandler {

    private final Map<OrderEvent, OrderStatus> eventTransitions = new EnumMap<>(OrderEvent.class);

    public CreatedStateHandler() {
        eventTransitions.put(OrderEvent.START_CHARGING, OrderStatus.CHARGING);
        eventTransitions.put(OrderEvent.CANCEL, OrderStatus.CANCELLED);
    }

    @Override
    public OrderStatus getStatus() {
        return OrderStatus.CREATED;
    }

    @Override
    public OrderStatus handle(OrderEvent event) {
        return eventTransitions.get(event);
    }

    @Override
    public void onEnter(ChargingOrderEntity order) {
        log.info("订单进入已创建状态: orderId={}", order.getId());
    }

    @Override
    public void onExit(ChargingOrderEntity order) {
        log.info("订单离开已创建状态: orderId={}, status={}", order.getId(), order.getStatus());
    }
}