package com.ev.order.controller;

import com.ev.common.core.dto.PageQuery;
import com.ev.common.core.result.PageResult;
import com.ev.common.core.result.R;
import com.ev.order.dto.WorkOrderVO;
import com.ev.order.service.WorkOrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "运维端-工单") @RestController @RequestMapping("/api/v1/ops/workorders") @RequiredArgsConstructor
public class WorkOrderController {
    private final WorkOrderService workOrderService;

    @Operation(summary = "工单列表") @GetMapping
    public R<PageResult<WorkOrderVO>> list(@RequestParam(required = false) String status,
                                            @RequestParam(required = false) String keyword,
                                            @RequestParam(defaultValue = "1") int page,
                                            @RequestParam(defaultValue = "10") int size) {
        PageQuery query = new PageQuery();
        query.setPage(page);
        query.setSize(size);
        return R.ok(workOrderService.page(query, status, keyword));
    }

    @Operation(summary = "接单") @PostMapping("/{id}/accept")
    public R<WorkOrderVO> accept(@PathVariable Long id) {
        return R.ok(workOrderService.accept(id, null));
    }

    @Operation(summary = "完成工单") @PostMapping("/{id}/complete")
    public R<WorkOrderVO> complete(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return R.ok(workOrderService.complete(id, body.get("result")));
    }

    @Operation(summary = "工单详情") @GetMapping("/{id}")
    public R<WorkOrderVO> detail(@PathVariable Long id) {
        return R.ok(workOrderService.detail(id));
    }

    @Operation(summary = "创建工单") @PostMapping
    public R<WorkOrderVO> create(@RequestBody Map<String, String> body) {
        return R.ok(workOrderService.create(body.get("title"), body.get("description"),
                body.get("type"), body.get("priority"), body.get("stationName"), body.get("deviceCode")));
    }

    @Operation(summary = "分配工单") @PostMapping("/{id}/assign")
    public R<WorkOrderVO> assign(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return R.ok(workOrderService.assign(id, body.get("assignee")));
    }

    @Operation(summary = "工单统计") @GetMapping("/statistics")
    public R<Map<String, Object>> statistics() {
        return R.ok(workOrderService.statistics());
    }
}
