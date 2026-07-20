package com.ev.charging.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

/**
 * 充电服务配置类
 * <p>
 * 集中管理外部服务依赖配置，替代硬编码 URL。
 */
@Configuration
public class ChargingServiceConfig {

    @Value("${ev-service.station.url:http://localhost:8082}")
    private String stationServiceUrl;

    @Value("${ev-service.order.url:http://localhost:8083}")
    private String orderServiceUrl;

    @Value("${ev-service.simulator.url:http://localhost:8085}")
    private String simulatorServiceUrl;

    /**
     * 提供 RestTemplate 用于服务间调用
     */
    @Bean
    public RestTemplate chargingRestTemplate() {
        return new RestTemplate();
    }

    public String getStationServiceUrl() {
        return stationServiceUrl;
    }

    public String getOrderServiceUrl() {
        return orderServiceUrl;
    }

    public String getSimulatorServiceUrl() {
        return simulatorServiceUrl;
    }
}
