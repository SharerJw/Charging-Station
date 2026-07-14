package com.ev.station;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@EnableDiscoveryClient
@MapperScan("com.ev.station.mapper")
@ComponentScan(basePackages = {"com.ev.station", "com.ev.common"})
public class StationApplication {
    public static void main(String[] args) {
        SpringApplication.run(StationApplication.class, args);
    }
}
