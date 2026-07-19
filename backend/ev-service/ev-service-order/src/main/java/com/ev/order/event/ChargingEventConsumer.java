package com.ev.order.event;

import com.ev.common.core.event.ChargingStoppedEvent;
import com.ev.common.core.event.OrderSettledEvent;
import com.ev.order.entity.ChargingOrderEntity;
import com.ev.order.mapper.ChargingOrderMapper;
import com.ev.order.statemachine.OrderEvent;
import com.ev.order.statemachine.OrderStateMachine;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * 充电事件消费者 - 手动容器调用
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ChargingEventConsumer {

    private final ChargingOrderMapper orderMapper;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final OrderStateMachine orderStateMachine;
    private static final ObjectMapper MAPPER = new ObjectMapper().registerModule(new JavaTimeModule());

    public void handleChargingStopped(String message) {
        try {
            if (message == null || !message.trim().startsWith("{")) {
                log.debug("跳过非JSON消息");
                return;
            }
            ChargingStoppedEvent event = MAPPER.readValue(message, ChargingStoppedEvent.class);
            log.info("收到充电结束事件: orderId={}, energy={}Wh, amount={}cents",
                    event.getOrderId(), event.getEnergyWh(), event.getTotalAmount());

            ChargingOrderEntity order = orderMapper.selectOne(
                    new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<ChargingOrderEntity>()
                            .eq(ChargingOrderEntity::getOrderNo, event.getOrderId()));
            if (order == null) {
                log.warn("订单不存在: orderNo={}", event.getOrderId());
                return;
            }

            // 使用状态机引擎进行状态转换
            orderStateMachine.fire(order, OrderEvent.SETTLED);

            // 更新订单详细信息
            order.setMeterStop(order.getMeterStart() + (event.getEnergyWh() != null ? event.getEnergyWh() : 0));
            order.setEnergyWh(event.getEnergyWh());
            order.setTotalAmount(event.getTotalAmount());
            orderMapper.updateById(order);
            log.info("订单自动结算完成: orderId={}, status={}", order.getId(), order.getStatus());

            OrderSettledEvent settledEvent = OrderSettledEvent.builder()
                    .orderId(order.getId()).orderNo(order.getOrderNo()).userId(order.getUserId())
                    .stationId(order.getStationId()).totalAmount(order.getTotalAmount())
                    .energyWh(order.getEnergyWh()).tenantId("T001")
                    .timestamp(java.time.Instant.now())
                    .build();
            kafkaTemplate.send("order.settled", String.valueOf(order.getId()), MAPPER.writeValueAsString(settledEvent));
            log.info("发布订单结算事件: orderId={}", order.getId());
        } catch (Exception e) {
            log.error("处理充电结束事件失败: {}", e.getMessage(), e);
        }
    }
}
