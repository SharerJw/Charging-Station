package com.ev.simulator.controller;

import com.ev.common.core.result.R;
import com.ev.simulator.dto.SimDeviceVO;
import com.ev.simulator.service.SimulatorDeviceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@Tag(name = "模拟器-设备") @RestController @RequestMapping("/api/simulator/devices") @RequiredArgsConstructor
public class SimulatorDeviceController {
    private final SimulatorDeviceService deviceService;

    @Operation(summary = "设备列表（分页+搜索）")
    @GetMapping
    public R<Map<String, Object>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status) {
        return R.ok(deviceService.list(page, size, keyword, status));
    }

    @Operation(summary = "设备详情") @GetMapping("/{id}")
    public R<SimDeviceVO> getById(@PathVariable String id) {
        return R.ok(deviceService.getById(id));
    }

    @Operation(summary = "创建设备") @PostMapping
    public R<SimDeviceVO> create(@RequestBody SimDeviceVO device) { return R.ok(deviceService.create(device)); }

    @Operation(summary = "删除设备") @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable String id) { deviceService.delete(id); return R.ok(); }

    @Operation(summary = "重置设备") @PostMapping("/{id}/reset")
    public R<Void> reset(@PathVariable String id) { deviceService.reset(id); return R.ok(); }

    @Operation(summary = "触发心跳") @PostMapping("/{id}/heartbeat")
    public R<SimDeviceVO> heartbeat(@PathVariable String id) {
        return R.ok(deviceService.heartbeat(id));
    }

    @Operation(summary = "触发启动通知") @PostMapping("/{id}/boot")
    public R<SimDeviceVO> boot(@PathVariable String id) {
        return R.ok(deviceService.boot(id));
    }

    @Operation(summary = "更新设备状态") @PostMapping("/{id}/status")
    public R<SimDeviceVO> updateStatus(@PathVariable String id, @RequestBody(required = false) Map<String, Object> body) {
        String status = body != null && body.containsKey("status") ? (String) body.get("status") : "online";
        return R.ok(deviceService.updateStatus(id, status));
    }
}
