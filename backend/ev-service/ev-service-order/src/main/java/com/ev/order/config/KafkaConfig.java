package com.ev.order.config;

import com.ev.order.event.ChargingEventConsumer;
import com.ev.order.event.NotificationEventConsumer;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.listener.AcknowledgingMessageListener;
import org.springframework.kafka.listener.ConcurrentMessageListenerContainer;
import org.springframework.kafka.listener.ContainerProperties;
import org.springframework.kafka.support.Acknowledgment;

import java.util.HashMap;
import java.util.Map;

/**
 * Kafka 配置 - 手动容器 + AcknowledgingMessageListener
 */
@Slf4j
@Configuration
public class KafkaConfig {

    private static final String BOOTSTRAP = "localhost:9092";
    private static final String GROUP_ID = "ev-order-v9";

    @Bean
    public ConsumerFactory<String, String> evConsumerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, BOOTSTRAP);
        props.put(ConsumerConfig.GROUP_ID_CONFIG, GROUP_ID);
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);
        return new DefaultKafkaConsumerFactory<>(props);
    }

    @Bean
    public ConcurrentMessageListenerContainer<String, String> chargingStoppedContainer(
            ConsumerFactory<String, String> evConsumerFactory,
            ChargingEventConsumer chargingEventConsumer) {

        ContainerProperties props = new ContainerProperties("charging.stopped");
        props.setGroupId(GROUP_ID);
        props.setAckMode(ContainerProperties.AckMode.MANUAL_IMMEDIATE);
        props.setMessageListener((AcknowledgingMessageListener<String, String>) (record, acknowledgment) -> {
            log.info("[Kafka] charging.stopped: offset={}, key={}", record.offset(), record.key());
            chargingEventConsumer.handleChargingStopped(record.value());
            acknowledgment.acknowledge();
        });

        ConcurrentMessageListenerContainer<String, String> container =
                new ConcurrentMessageListenerContainer<>(evConsumerFactory, props);
        container.setConcurrency(1);
        container.setAutoStartup(true);
        return container;
    }

    @Bean
    public ConcurrentMessageListenerContainer<String, String> orderSettledContainer(
            ConsumerFactory<String, String> evConsumerFactory,
            NotificationEventConsumer notificationEventConsumer) {

        ContainerProperties props = new ContainerProperties("order.settled");
        props.setGroupId(GROUP_ID);
        props.setAckMode(ContainerProperties.AckMode.MANUAL_IMMEDIATE);
        props.setMessageListener((AcknowledgingMessageListener<String, String>) (record, acknowledgment) -> {
            log.info("[Kafka] order.settled: offset={}, key={}", record.offset(), record.key());
            notificationEventConsumer.handleOrderSettled(record.value());
            acknowledgment.acknowledge();
        });

        ConcurrentMessageListenerContainer<String, String> container =
                new ConcurrentMessageListenerContainer<>(evConsumerFactory, props);
        container.setConcurrency(1);
        container.setAutoStartup(true);
        return container;
    }

    @Bean
    public ConcurrentMessageListenerContainer<String, String> alertCreatedContainer(
            ConsumerFactory<String, String> evConsumerFactory,
            NotificationEventConsumer notificationEventConsumer) {

        ContainerProperties props = new ContainerProperties("alert.created");
        props.setGroupId(GROUP_ID);
        props.setAckMode(ContainerProperties.AckMode.MANUAL_IMMEDIATE);
        props.setMessageListener((AcknowledgingMessageListener<String, String>) (record, acknowledgment) -> {
            log.info("[Kafka] alert.created: offset={}, key={}", record.offset(), record.key());
            notificationEventConsumer.handleAlertCreated(record.value());
            acknowledgment.acknowledge();
        });

        ConcurrentMessageListenerContainer<String, String> container =
                new ConcurrentMessageListenerContainer<>(evConsumerFactory, props);
        container.setConcurrency(1);
        container.setAutoStartup(true);
        return container;
    }
}
