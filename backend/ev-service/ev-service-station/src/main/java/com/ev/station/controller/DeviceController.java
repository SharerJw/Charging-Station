package com.ev.station.controller;

import com.ev.common.core.result.R;
import com.ev.common.core.result.PageResult;
import com.ev.station.dto.DeviceQuery;
import com.ev.station.dto.DeviceVO;
import com.ev.station.service.DeviceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@Tag(name = "设备管理") @RestController @RequiredArgsConstructor
public class DeviceController {
    private final DeviceService deviceService;

    @Operation(summary = "站点下设备列表") @GetMapping("/api/stations/{stationId}/devices")
    public R<List<DeviceVO>> stationDevices(@PathVariable Long stationId) { return R.ok(deviceService.listByStation(stationId)); }

    @Operation(summary = "设备列表") @GetMapping("/api/devices")
    public R<PageResult<DeviceVO>> list(@Valid DeviceQuery query) {
        return R.ok(deviceService.page(query));
    }

    @Operation(summary = "设备详情") @GetMapping("/api/devices/{id}")
    public R<DeviceVO> detail(@PathVariable Long id) { return R.ok(deviceService.detail(id)); }

    @Operation(summary = "远程重启") @PostMapping("/api/devices/{id}/reset")
    public R<Void> reset(@PathVariable Long id) { deviceService.reset(id); return R.ok(); }

    @Operation(summary = "解锁枪头") @PostMapping("/api/devices/{id}/connectors/{connectorId}/unlock")
    public R<Void> unlock(@PathVariable Long id, @PathVariable Integer connectorId) { deviceService.unlock(id, connectorId); return R.ok(); }

    @Operation(summary = "固件升级") @PostMapping("/api/devices/{id}/firmware")
    public R<Void> firmware(@PathVariable Long id, @RequestBody Map<String, String> body) {
        com.ev.common.core.util.SecurityUtils.getTraceId(); // placeholder
        return R.ok();
    }

    @Operation(summary = "遥测数据") @GetMapping("/api/devices/{id}/telemetry")
    public R<Map<String, Object>> telemetry(@PathVariable Long id) {
        return R.ok(Map.of("power", 95000, "voltage", 750, "current", 126, "soc", 65, "temperature", 42));
    }
}
