package com.ev.order.statemachine;

import com.ev.order.entity.ChargingOrderEntity;

/**
 * 订单状态处理器接口
 */
public interface OrderStateHandler {
    /**
     * 获取处理器对应的状态
     * @return 订单状态
     */
    OrderStatus getStatus();

    /**
     * 处理事件，返回下一个状态
     * @param event 订单事件
     * @return 下一个状态，如果事件不合法则返回null
     */
    OrderStatus handle(OrderEvent event);

    /**
     * 进入该状态时的业务逻辑
     * @param order 订单实体
     */
    void onEnter(ChargingOrderEntity order);

    /**
     * 离开该状态时的业务逻辑
     * @param order 订单实体
     */
    void onExit(ChargingOrderEntity order);
}