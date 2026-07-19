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
 * 充电中状态处理器
 */
@Slf4j
@Component
public class ChargingStateHandler implements OrderStateHandler {

    private final Map<OrderEvent, OrderStatus> eventTransitions = new EnumMap<>(OrderEvent.class);

    public ChargingStateHandler() {
        eventTransitions.put(OrderEvent.STOP_CHARGING, OrderStatus.STOPPING);
        eventTransitions.put(OrderEvent.ABNORMAL, OrderStatus.ABNORMAL);
        eventTransitions.put(OrderEvent.SETTLED, OrderStatus.SETTLED); // 充电结束直接结算
    }

    @Override
    public OrderStatus getStatus() {
        return OrderStatus.CHARGING;
    }

    @Override
    public OrderStatus handle(OrderEvent event) {
        return eventTransitions.get(event);
    }

    @Override
    public void onEnter(ChargingOrderEntity order) {
        log.info("订单进入充电中状态: orderId={}", order.getId());
        order.setStartTime(LocalDateTime.now());
    }

    @Override
    public void onExit(ChargingOrderEntity order) {
        log.info("订单离开充电中状态: orderId={}, status={}", order.getId(), order.getStatus());
    }
}