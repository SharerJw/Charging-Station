package com.ev.common.core.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.Getter;
import org.springframework.stereotype.Component;

import java.util.concurrent.atomic.AtomicInteger;

/**
 * 业务指标埋点 (Micrometer + Prometheus)
 */
@Component
@Getter
public class BusinessMetrics {

    private final Counter chargingOrderCounter;
    private final Counter chargingEnergyCounter;
    private final Counter apiErrorCounter;
    private final AtomicInteger onlineDevices;
    private final AtomicInteger availablePorts;

    public BusinessMetrics(MeterRegistry meterRegistry) {
        // 充电订单计数（按状态分）
        this.chargingOrderCounter = Counter.builder("charging_order_total")
                .description("充电订单总数")
                .tag("status", "all")
                .register(meterRegistry);

        // 累计充电量
        this.chargingEnergyCounter = Counter.builder("charging_energy_wh_total")
                .description("累计充电量(Wh)")
                .register(meterRegistry);

        // API 错误计数
        this.apiErrorCounter = Counter.builder("api_error_total")
                .description("API错误总数")
                .register(meterRegistry);

        // 在线设备数（Gauge）
        this.onlineDevices = new AtomicInteger(10);
        Gauge.builder("device_online_count", onlineDevices, AtomicInteger::doubleValue)
                .description("在线设备数")
                .register(meterRegistry);

        // 可用枪数（Gauge）
        this.availablePorts = new AtomicInteger(24);
        Gauge.builder("station_available_ports", availablePorts, AtomicInteger::doubleValue)
                .description("可用充电枪数")
                .register(meterRegistry);
    }

    public void recordOrder() {
        chargingOrderCounter.increment();
    }

    public void recordEnergy(double wh) {
        chargingEnergyCounter.increment(wh);
    }

    public void recordApiError() {
        apiErrorCounter.increment();
    }

    public void updateOnlineDevices(int count) {
        onlineDevices.set(count);
    }

    public void updateAvailablePorts(int count) {
        availablePorts.set(count);
    }
}
