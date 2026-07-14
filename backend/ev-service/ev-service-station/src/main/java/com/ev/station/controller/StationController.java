package com.ev.station.controller;

import com.ev.common.core.result.R;
import com.ev.common.core.result.PageResult;
import com.ev.common.security.annotation.AuditLog;
import com.ev.station.dto.*;
import com.ev.station.service.StationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@Tag(name = "充电站管理") @RestController @RequestMapping("/api/stations") @RequiredArgsConstructor
public class StationController {
    private final StationService stationService;

    @Operation(summary = "分页查询充电站") @GetMapping
    public R<PageResult<StationVO>> list(@Valid StationQuery query) { return R.ok(stationService.page(query)); }

    @Operation(summary = "充电站详情") @GetMapping("/{id}")
    public R<StationVO> detail(@PathVariable Long id) { return R.ok(stationService.detail(id)); }

    @Operation(summary = "创建充电站") @AuditLog(action = "CREATE", resource = "station") @PostMapping
    public R<StationVO> create(@Valid @RequestBody StationCreateReq req) { return R.ok(stationService.create(req)); }

    @Operation(summary = "编辑充电站") @AuditLog(action = "UPDATE", resource = "station") @PutMapping("/{id}")
    public R<StationVO> update(@PathVariable Long id, @Valid @RequestBody StationCreateReq req) { return R.ok(stationService.update(id, req)); }

    @Operation(summary = "删除充电站") @AuditLog(action = "DELETE", resource = "station") @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable Long id) { stationService.delete(id); return R.ok(); }

    @Operation(summary = "修改充电站状态") @PutMapping("/{id}/status")
    public R<Void> updateStatus(@PathVariable Long id, @RequestBody java.util.Map<String, String> body) {
        stationService.updateStatus(id, body.get("status")); return R.ok();
    }
}
