package com.ev.charging.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import java.util.Map;

@FeignClient(name = "ev-service-station", path = "/internal")
public interface StationFeignClient {
    @GetMapping("/stats")
    Map<String, Object> getStats();

    @GetMapping("/devices")
    Map<String, Object> getDevices(@RequestParam(value = "limit", defaultValue = "1000") int limit);

    @GetMapping("/stations/{id}")
    Map<String, Object> getStation(@PathVariable("id") Long id);
}
