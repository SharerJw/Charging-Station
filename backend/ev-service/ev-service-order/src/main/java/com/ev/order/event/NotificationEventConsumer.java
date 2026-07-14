package com.ev.order.event;

import com.ev.common.core.event.AlertCreatedEvent;
import com.ev.common.core.event.OrderSettledEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * 通知事件消费者
 */
@Slf4j
@Component
public class NotificationEventConsumer {

    private static final ObjectMapper MAPPER = new ObjectMapper().registerModule(new JavaTimeModule());

    @KafkaListener(topics = "order.settled", groupId = "ev-notification-consumer")
    public void handleOrderSettled(String message) {
        try {
            if (message == null || !message.trim().startsWith("{")) return;
            OrderSettledEvent event = MAPPER.readValue(message, OrderSettledEvent.class);
            log.info("[通知] 订单结算通知: orderNo={}, userId={}, amount={}cents",
                    event.getOrderNo(), event.getUserId(), event.getTotalAmount());
        } catch (Exception e) {
            log.error("处理订单结算通知失败: {}", e.getMessage());
        }
    }

    @KafkaListener(topics = "alert.created", groupId = "ev-notification-consumer")
    public void handleAlertCreated(String message) {
        try {
            if (message == null || !message.trim().startsWith("{")) return;
            AlertCreatedEvent event = MAPPER.readValue(message, AlertCreatedEvent.class);
            log.info("[通知] 告警通知: level={}, title={}", event.getLevel(), event.getTitle());
        } catch (Exception e) {
            log.error("处理告警通知失败: {}", e.getMessage());
        }
    }
}
