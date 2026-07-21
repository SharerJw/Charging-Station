package com.ev.order.controller;

import com.ev.common.core.dto.PageQuery;
import com.ev.common.core.result.PageResult;
import com.ev.common.core.result.R;
import com.ev.order.dto.AlertVO;
import com.ev.order.service.AlertService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "运维端-告警") @RestController @RequestMapping("/api/v1/ops/alerts") @RequiredArgsConstructor
public class AlertController {
    private final AlertService alertService;

    @Operation(summary = "告警列表") @GetMapping
    public R<PageResult<AlertVO>> list(@RequestParam(required = false) String level,
                                        @RequestParam(required = false) String status,
                                        @RequestParam(required = false) String keyword,
                                        @RequestParam(defaultValue = "1") int page,
                                        @RequestParam(defaultValue = "10") int size) {
        PageQuery query = new PageQuery();
        query.setPage(page);
        query.setSize(size);
        return R.ok(alertService.page(query, level, status, keyword));
    }

    @Operation(summary = "处理告警") @PostMapping("/{id}/handle")
    public R<AlertVO> handle(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return R.ok(alertService.handle(id, body.get("handler"), body.get("result")));
    }

    @Operation(summary = "忽略告警") @PostMapping("/{id}/ignore")
    public R<Void> ignore(@PathVariable Long id) {
        alertService.ignore(id, null);
        return R.ok();
    }

    @Operation(summary = "告警详情") @GetMapping("/{id}")
    public R<AlertVO> detail(@PathVariable Long id) {
        return R.ok(alertService.detail(id));
    }

    @Operation(summary = "告警统计") @GetMapping("/statistics")
    public R<Map<String, Object>> statistics() {
        return R.ok(alertService.statistics());
    }
}
