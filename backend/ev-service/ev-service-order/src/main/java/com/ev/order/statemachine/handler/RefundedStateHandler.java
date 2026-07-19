package com.ev.order.statemachine.handler;

import com.ev.order.entity.ChargingOrderEntity;
import com.ev.order.statemachine.OrderEvent;
import com.ev.order.statemachine.OrderStateHandler;
import com.ev.order.statemachine.OrderStatus;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * 已退款状态处理器（终态）
 */
@Slf4j
@Component
public class RefundedStateHandler implements OrderStateHandler {

    @Override
    public OrderStatus getStatus() {
        return OrderStatus.REFUNDED;
    }

    @Override
    public OrderStatus handle(OrderEvent event) {
        // 终态，不接受任何事件
        return null;
    }

    @Override
    public void onEnter(ChargingOrderEntity order) {
        log.info("订单进入已退款状态（终态）: orderId={}", order.getId());
    }

    @Override
    public void onExit(ChargingOrderEntity order) {
        log.warn("订单尝试离开已退款状态（终态）: orderId={}", order.getId());
    }
}