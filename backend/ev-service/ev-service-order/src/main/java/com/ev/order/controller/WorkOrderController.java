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
}
