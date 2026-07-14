package com.ev.simulator.controller;

import com.ev.common.core.result.R;
import com.ev.simulator.dto.SimTransactionVO;
import com.ev.simulator.engine.ChargingSimulator;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@Tag(name = "模拟器-充电") @RestController @RequestMapping("/api/simulator/charging") @RequiredArgsConstructor
public class ChargingSimController {
    private final ChargingSimulator chargingSimulator;

    @Operation(summary = "启动充电模拟") @PostMapping("/start")
    public R<SimTransactionVO> start(@RequestBody Map<String, Object> body) {
        return R.ok(chargingSimulator.startCharging(
                (String) body.get("chargePointId"),
                body.get("connectorId") != null ? Integer.parseInt(body.get("connectorId").toString()) : 1,
                (String) body.getOrDefault("idTag", "USER001"),
                body.get("targetSoc") != null ? Integer.parseInt(body.get("targetSoc").toString()) : 80));
    }

    @Operation(summary = "停止充电模拟") @PostMapping("/{txId}/stop")
    public R<SimTransactionVO> stop(@PathVariable String txId) { return R.ok(chargingSimulator.stopCharging(txId)); }

    @Operation(summary = "充电状态") @GetMapping("/{txId}/status")
    public R<SimTransactionVO> status(@PathVariable String txId) { return R.ok(chargingSimulator.getTransaction(txId)); }

    @Operation(summary = "按设备编码和枪号查询充电状态") @GetMapping("/{deviceCode}/{connectorId}/status")
    public R<SimTransactionVO> statusByDevice(@PathVariable String deviceCode, @PathVariable Integer connectorId) {
        return R.ok(chargingSimulator.findByChargePointAndConnector(deviceCode, connectorId));
    }

    @Operation(summary = "按设备编码和枪号停止充电") @PostMapping("/{deviceCode}/{connectorId}/stop")
    public R<SimTransactionVO> stopByDevice(@PathVariable String deviceCode, @PathVariable Integer connectorId) {
        return R.ok(chargingSimulator.stopByChargePointAndConnector(deviceCode, connectorId));
    }
}
