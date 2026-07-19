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
 * 结算中状态处理器
 */
@Slf4j
@Component
public class SettlingStateHandler implements OrderStateHandler {

    private final Map<OrderEvent, OrderStatus> eventTransitions = new EnumMap<>(OrderEvent.class);

    public SettlingStateHandler() {
        eventTransitions.put(OrderEvent.SETTLED, OrderStatus.SETTLED);
    }

    @Override
    public OrderStatus getStatus() {
        return OrderStatus.SETTLING;
    }

    @Override
    public OrderStatus handle(OrderEvent event) {
        return eventTransitions.get(event);
    }

    @Override
    public void onEnter(ChargingOrderEntity order) {
        log.info("订单进入结算中状态: orderId={}", order.getId());
    }

    @Override
    public void onExit(ChargingOrderEntity order) {
        log.info("订单离开结算中状态: orderId={}, status={}", order.getId(), order.getStatus());
    }
}