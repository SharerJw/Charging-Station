package com.ev.simulator.controller;

import com.ev.common.core.result.R;
import com.ev.simulator.dto.ScenarioCreateRequest;
import com.ev.simulator.dto.ScenarioVO;
import com.ev.simulator.service.ScenarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@Tag(name = "模拟器-场景") @RestController @RequestMapping("/api/simulator/scenarios") @RequiredArgsConstructor
public class ScenarioController {
    private final ScenarioService scenarioService;

    @Operation(summary = "场景列表") @GetMapping public R<List<ScenarioVO>> list() { return R.ok(scenarioService.list()); }

    @Operation(summary = "创建场景") @PostMapping
    public R<ScenarioVO> create(@Valid @RequestBody ScenarioCreateRequest req) {
        ScenarioVO sc = ScenarioVO.builder()
                .name(req.getName())
                .description(req.getDescription())
                .deviceCount(req.getDeviceCount())
                .build();
        return R.ok(scenarioService.create(sc));
    }

    @Operation(summary = "执行场景") @PostMapping("/{id}/execute") public R<Void> execute(@PathVariable String id) { scenarioService.execute(id); return R.ok(); }
    @Operation(summary = "停止场景") @PostMapping("/{id}/stop") public R<Void> stop(@PathVariable String id) { scenarioService.stop(id); return R.ok(); }
}
