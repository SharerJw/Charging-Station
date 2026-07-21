package com.ev.station.controller;

import com.ev.common.core.result.R;
import com.ev.common.core.result.PageResult;
import com.ev.station.dto.StationQuery;
import com.ev.station.dto.StationVO;
import com.ev.station.dto.DeviceVO;
import com.ev.station.service.DeviceService;
import com.ev.station.service.StationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@Tag(name = "运维端-充电站") @RestController @RequestMapping("/api/v1/ops/stations") @RequiredArgsConstructor
public class OpsStationController {
    private final StationService stationService;
    private final DeviceService deviceService;

    @Operation(summary = "运维站点列表") @GetMapping
    public R<List<StationVO>> list() {
        StationQuery query = new StationQuery();
        query.setPage(1);
        query.setSize(1000);
        return R.ok(stationService.search(query).getList());
    }

    @Operation(summary = "运维站点详情") @GetMapping("/{id}")
    public R<StationVO> detail(@PathVariable Long id) { return R.ok(stationService.detail(id)); }

    @Operation(summary = "设备详情") @GetMapping("/devices/{id}")
    public R<DeviceVO> deviceDetail(@PathVariable Long id) { return R.ok(deviceService.detail(id)); }

    @Operation(summary = "设备状态") @GetMapping("/devices/{id}/status")
    public R<Map<String, Object>> deviceStatus(@PathVariable Long id) { return R.ok(deviceService.deviceStatus(id)); }

    @Operation(summary = "设备故障记录") @GetMapping("/devices/{id}/faults")
    public R<List<Map<String, Object>>> deviceFaults(@PathVariable Long id) { return R.ok(deviceService.deviceFaults(id)); }
}
