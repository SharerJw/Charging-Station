package com.ev.order.controller;

import com.ev.common.core.result.R;
import com.ev.order.dto.InspectionTaskVO;
import com.ev.order.service.InspectionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "运维端-巡检") @RestController @RequestMapping("/api/v1/ops/inspections") @RequiredArgsConstructor
public class InspectionController {
    private final InspectionService inspectionService;

    @Operation(summary = "巡检任务列表") @GetMapping
    public R<List<InspectionTaskVO>> list(@RequestParam(required = false) String status) {
        return R.ok(inspectionService.list(status));
    }

    @Operation(summary = "开始巡检") @PostMapping("/{id}/start")
    public R<InspectionTaskVO> start(@PathVariable Long id) {
        return R.ok(inspectionService.start(id, null));
    }

    @Operation(summary = "提交巡检结果") @PostMapping("/{id}/submit")
    public R<InspectionTaskVO> submit(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return R.ok(inspectionService.submit(id, null));
    }

    @Operation(summary = "巡检详情") @GetMapping("/{id}")
    public R<InspectionTaskVO> detail(@PathVariable Long id) {
        return R.ok(inspectionService.detail(id));
    }
}
