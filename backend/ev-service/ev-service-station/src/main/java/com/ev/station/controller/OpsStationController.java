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

@Tag(name = "运维端-充电站") @RestController @RequestMapping("/api/v1/ops/stations") @RequiredArgsConstructor
public class OpsStationController {
    private final StationService stationService;

    @Operation(summary = "运维站点列表") @GetMapping
    public R<List<StationVO>> list() {
        StationQuery query = new StationQuery();
        query.setPage(1);
        query.setSize(1000);
        return R.ok(stationService.search(query).getList());
    }

    @Operation(summary = "运维站点详情") @GetMapping("/{id}")
    public R<StationVO> detail(@PathVariable Long id) { return R.ok(stationService.detail(id)); }
}
