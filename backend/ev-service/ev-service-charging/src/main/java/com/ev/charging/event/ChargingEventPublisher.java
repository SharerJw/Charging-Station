package com.ev.charging.event;

import com.ev.common.core.event.ChargingStartedEvent;
import com.ev.common.core.event.ChargingStoppedEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * 充电事件发布者 - 直接使用 Kafka Producer API，绕过 Spring Cloud 自动配置
 */
@Slf4j
@Component
public class ChargingEventPublisher {

    @Value("${spring.kafka.bootstrap-servers:localhost:9092}")
    private String bootstrapServers;

    private static final ObjectMapper MAPPER = new ObjectMapper().registerModule(new JavaTimeModule());
    private KafkaProducer<String, String> producer;

    @PostConstruct
    public void init() {
        Map<String, Object> props = new HashMap<>();
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        props.put(ProducerConfig.ACKS_CONFIG, "1");
        producer = new KafkaProducer<>(props);
        log.info("Kafka Producer 初始化完成: bootstrap={}", bootstrapServers);
    }

    public void publishStarted(ChargingStartedEvent event) {
        publish("charging.started", event.getOrderId(), event);
    }

    public void publishStopped(ChargingStoppedEvent event) {
        publish("charging.stopped", event.getOrderId(), event);
    }

    private void publish(String topic, String key, Object event) {
        try {
            String json = MAPPER.writeValueAsString(event);
            producer.send(new ProducerRecord<>(topic, key, json), (metadata, exception) -> {
                if (exception != null) {
                    log.warn("事件发布失败: topic={}, key={}, error={}", topic, key, exception.getMessage());
                } else {
                    log.info("事件发布成功: topic={}, key={}, partition={}, offset={}",
                            topic, key, metadata.partition(), metadata.offset());
                }
            });
        } catch (Exception e) {
            log.warn("事件序列化失败: topic={}, key={}, error={}", topic, key, e.getMessage());
        }
    }
}
