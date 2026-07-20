package com.ev.simulator.controller;

import com.ev.common.core.result.R;
import com.ev.simulator.dto.ChargingStartRequest;
import com.ev.simulator.dto.SimTransactionVO;
import com.ev.simulator.engine.ChargingSimulator;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@Tag(name = "模拟器-充电") @RestController @RequestMapping("/api/simulator/charging") @RequiredArgsConstructor
public class ChargingSimController {
    private final ChargingSimulator chargingSimulator;

    @Operation(summary = "启动充电模拟") @PostMapping("/start")
    public R<SimTransactionVO> start(@Valid @RequestBody ChargingStartRequest req) {
        return R.ok(chargingSimulator.startCharging(
                req.getChargePointId(),
                req.getConnectorId() != null ? req.getConnectorId() : 1,
                req.getIdTag() != null ? req.getIdTag() : "USER001",
                req.getTargetSoc() != null ? req.getTargetSoc() : 80));
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
