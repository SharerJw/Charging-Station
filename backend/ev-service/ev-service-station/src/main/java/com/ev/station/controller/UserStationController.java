package com.ev.station.controller;

import com.ev.common.core.result.R;
import com.ev.common.core.result.PageResult;
import com.ev.station.dto.StationQuery;
import com.ev.station.dto.StationVO;
import com.ev.station.service.StationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@Tag(name = "用户端-充电站") @RestController @RequestMapping("/api/v1/stations") @RequiredArgsConstructor
public class UserStationController {
    private final StationService stationService;

    @Operation(summary = "搜索充电站") @GetMapping
    public R<PageResult<StationVO>> search(StationQuery query) {
        return R.ok(stationService.search(query));
    }

    @Operation(summary = "充电站详情") @GetMapping("/{id}")
    public R<StationVO> detail(@PathVariable Long id) { return R.ok(stationService.detail(id)); }
}
