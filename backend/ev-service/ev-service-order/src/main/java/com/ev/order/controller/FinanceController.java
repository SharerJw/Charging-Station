package com.ev.order.controller;

import com.ev.common.core.result.R;
import com.ev.common.core.result.PageResult;
import com.ev.common.core.dto.PageQuery;
import com.ev.order.dto.*;
import com.ev.order.service.FinanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@Tag(name = "财务管理") @RestController @RequestMapping("/api/finance") @RequiredArgsConstructor
public class FinanceController {
    private final FinanceService financeService;

    @Operation(summary = "财务概览") @GetMapping("/overview")
    public R<FinanceSummaryVO> overview(@RequestParam(required = false) String startTime, @RequestParam(required = false) String endTime) {
        return R.ok(financeService.summary(startTime, endTime));
    }

    @Operation(summary = "交易明细") @GetMapping("/transactions")
    public R<PageResult<OrderVO>> transactions(PageQuery query) { return R.ok(financeService.bills(query)); }

    @Operation(summary = "结算列表") @GetMapping("/settlement")
    public R<PageResult<OrderVO>> settlement(PageQuery query) { return R.ok(financeService.settlements(query)); }
}
