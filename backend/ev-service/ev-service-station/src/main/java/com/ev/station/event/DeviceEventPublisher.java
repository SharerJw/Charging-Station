package com.ev.station.event;

import com.ev.common.core.event.AlertCreatedEvent;
import com.ev.common.core.event.DeviceStatusChangedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

/**
 * 设备事件发布者
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DeviceEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishStatusChanged(DeviceStatusChangedEvent event) {
        try {
            kafkaTemplate.send("device.status.changed", String.valueOf(event.getDeviceId()), event);
            log.info("发布设备状态变更事件: deviceId={}, {}→{}", event.getDeviceId(), event.getOldStatus(), event.getNewStatus());
        } catch (Exception e) {
            log.warn("发布设备状态事件失败(非致命): {}", e.getMessage());
        }
    }

    public void publishAlertCreated(AlertCreatedEvent event) {
        try {
            kafkaTemplate.send("alert.created", String.valueOf(event.getAlertId()), event);
            log.info("发布告警事件: alertId={}, level={}, title={}", event.getAlertId(), event.getLevel(), event.getTitle());
        } catch (Exception e) {
            log.warn("发布告警事件失败(非致命): {}", e.getMessage());
        }
    }
}
