package com.ev.order.controller;

import com.ev.common.core.dto.PageQuery;
import com.ev.common.core.result.PageResult;
import com.ev.common.core.result.R;
import com.ev.order.dto.DispatchRecordVO;
import com.ev.order.dto.DispatchRuleVO;
import com.ev.order.dto.OperatorVO;
import com.ev.order.service.DispatchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "运维端-调度") @RestController @RequestMapping("/api/v1/ops/dispatch") @RequiredArgsConstructor
public class DispatchController {
    private final DispatchService dispatchService;

    @Operation(summary = "调度规则列表") @GetMapping("/rules")
    public R<PageResult<DispatchRuleVO>> ruleList(@RequestParam(defaultValue = "1") int page,
                                                   @RequestParam(defaultValue = "10") int size) {
        PageQuery query = new PageQuery();
        query.setPage(page);
        query.setSize(size);
        return R.ok(dispatchService.rulePage(query));
    }

    @Operation(summary = "调度规则详情") @GetMapping("/rules/{id}")
    public R<DispatchRuleVO> ruleDetail(@PathVariable Long id) {
        return R.ok(dispatchService.ruleDetail(id));
    }

    @Operation(summary = "调度记录列表") @GetMapping("/records")
    public R<PageResult<DispatchRecordVO>> recordList(@RequestParam(defaultValue = "1") int page,
                                                       @RequestParam(defaultValue = "10") int size) {
        PageQuery query = new PageQuery();
        query.setPage(page);
        query.setSize(size);
        return R.ok(dispatchService.recordPage(query));
    }

    @Operation(summary = "可用运维人员") @GetMapping("/operators")
    public R<List<OperatorVO>> operators() {
        return R.ok(dispatchService.operators());
    }
}
