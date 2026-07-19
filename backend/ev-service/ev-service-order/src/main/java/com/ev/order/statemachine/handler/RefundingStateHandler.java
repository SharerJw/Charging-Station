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
 * 退款中状态处理器
 */
@Slf4j
@Component
public class RefundingStateHandler implements OrderStateHandler {

    private final Map<OrderEvent, OrderStatus> eventTransitions = new EnumMap<>(OrderEvent.class);

    public RefundingStateHandler() {
        eventTransitions.put(OrderEvent.REFUNDED, OrderStatus.REFUNDED);
        // 退款失败可以回到PAID状态
        eventTransitions.put(OrderEvent.ABNORMAL, OrderStatus.PAID);
    }

    @Override
    public OrderStatus getStatus() {
        return OrderStatus.REFUNDING;
    }

    @Override
    public OrderStatus handle(OrderEvent event) {
        return eventTransitions.get(event);
    }

    @Override
    public void onEnter(ChargingOrderEntity order) {
        log.info("订单进入退款中状态: orderId={}", order.getId());
    }

    @Override
    public void onExit(ChargingOrderEntity order) {
        log.info("订单离开退款中状态: orderId={}, status={}", order.getId(), order.getStatus());
    }
}