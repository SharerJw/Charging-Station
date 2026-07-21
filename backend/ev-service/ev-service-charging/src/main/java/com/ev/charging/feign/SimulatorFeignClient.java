package com.ev.charging.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import java.util.Map;

@FeignClient(name = "ev-service-simulator", path = "/internal")
public interface SimulatorFeignClient {
    @GetMapping("/stats")
    Map<String, Object> getStats();
}
