package com.ev.simulator.controller;

import com.ev.common.core.result.R;
import com.ev.simulator.dto.OcppMessageVO;
import com.ev.simulator.service.OcppService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@Tag(name = "模拟器-OCPP") @RestController @RequestMapping("/api/simulator/ocpp") @RequiredArgsConstructor
public class OcppController {
    private final OcppService ocppService;

    @Operation(summary = "发送OCPP消息") @PostMapping("/send")
    public R<OcppMessageVO> send(@RequestBody OcppMessageVO msg) { return R.ok(ocppService.send(msg)); }

    @Operation(summary = "消息历史") @GetMapping("/history")
    public R<List<OcppMessageVO>> history(@RequestParam(required = false) String chargePointId,
                                           @RequestParam(defaultValue = "50") int limit) {
        return R.ok(ocppService.history(chargePointId, limit));
    }
}
