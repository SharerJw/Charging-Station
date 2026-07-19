package com.ev.order.statemachine.handler;

import com.ev.order.entity.ChargingOrderEntity;
import com.ev.order.statemachine.OrderEvent;
import com.ev.order.statemachine.OrderStateHandler;
import com.ev.order.statemachine.OrderStatus;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.Map;

/**
 * 停止中状态处理器
 */
@Slf4j
@Component
public class StoppingStateHandler implements OrderStateHandler {

    private final Map<OrderEvent, OrderStatus> eventTransitions = new EnumMap<>(OrderEvent.class);

    public StoppingStateHandler() {
        eventTransitions.put(OrderEvent.CHARGING_STOPPED, OrderStatus.STOPPED);
    }

    @Override
    public OrderStatus getStatus() {
        return OrderStatus.STOPPING;
    }

    @Override
    public OrderStatus handle(OrderEvent event) {
        return eventTransitions.get(event);
    }

    @Override
    public void onEnter(ChargingOrderEntity order) {
        log.info("订单进入停止中状态: orderId={}", order.getId());
    }

    @Override
    public void onExit(ChargingOrderEntity order) {
        log.info("订单离开停止中状态: orderId={}, status={}", order.getId(), order.getStatus());
    }
}