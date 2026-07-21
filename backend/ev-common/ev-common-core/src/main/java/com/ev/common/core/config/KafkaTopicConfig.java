package com.ev.common.core.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.KafkaAdmin;

@Configuration
public class KafkaTopicConfig {

    public static final String TOPIC_CHARGING_STARTED = "charging.started";
    public static final String TOPIC_CHARGING_STOPPED = "charging.stopped";
    public static final String TOPIC_ORDER_SETTLED = "order.settled";
    public static final String TOPIC_ALERT_CREATED = "alert.created";
    public static final String TOPIC_DEVICE_STATUS_CHANGED = "device.status.changed";

    @Bean
    public NewTopic chargingStartedTopic() {
        return TopicBuilder.name(TOPIC_CHARGING_STARTED)
                .partitions(3).replicas(1)
                .config("retention.ms", "604800000").build();
    }

    @Bean
    public NewTopic chargingStoppedTopic() {
        return TopicBuilder.name(TOPIC_CHARGING_STOPPED)
                .partitions(3).replicas(1)
                .config("retention.ms", "604800000").build();
    }

    @Bean
    public NewTopic orderSettledTopic() {
        return TopicBuilder.name(TOPIC_ORDER_SETTLED)
                .partitions(3).replicas(1)
                .config("retention.ms", "604800000").build();
    }

    @Bean
    public NewTopic alertCreatedTopic() {
        return TopicBuilder.name(TOPIC_ALERT_CREATED)
                .partitions(3).replicas(1)
                .config("retention.ms", "604800000").build();
    }

    @Bean
    public NewTopic deviceStatusChangedTopic() {
        return TopicBuilder.name(TOPIC_DEVICE_STATUS_CHANGED)
                .partitions(3).replicas(1)
                .config("retention.ms", "604800000").build();
    }

    @Bean
    public KafkaAdmin.NewTopics autoTopics() {
        return new KafkaAdmin.NewTopics(
                chargingStartedTopic(),
                chargingStoppedTopic(),
                orderSettledTopic(),
                alertCreatedTopic(),
                deviceStatusChangedTopic()
        );
    }
}
