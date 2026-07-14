package com.ev.order.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ev.common.core.result.R;
import com.ev.order.entity.InspectionTaskEntity;
import com.ev.order.dto.InspectionTaskVO;
import com.ev.order.mapper.InspectionTaskMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Tag(name = "运维端-巡检") @RestController @RequestMapping("/api/v1/ops/inspections") @RequiredArgsConstructor
public class InspectionController {
    private final InspectionTaskMapper inspectionMapper;

    @Operation(summary = "巡检任务列表") @GetMapping
    public R<List<InspectionTaskVO>> list(@RequestParam(required = false) String status) {
        LambdaQueryWrapper<InspectionTaskEntity> wrapper = new LambdaQueryWrapper<>();
        if (status != null && !status.isBlank()) wrapper.eq(InspectionTaskEntity::getStatus, status);
        wrapper.orderByDesc(InspectionTaskEntity::getCreatedAt);
        return R.ok(inspectionMapper.selectList(wrapper).stream().map(this::toVO).collect(Collectors.toList()));
    }

    @Operation(summary = "开始巡检") @PostMapping("/{id}/start")
    public R<InspectionTaskVO> start(@PathVariable Long id) {
        InspectionTaskEntity task = inspectionMapper.selectById(id);
        if (task == null) return R.fail(4000, "巡检任务不存在");
        task.setStatus("in_progress");
        task.setStartTime(LocalDateTime.now());
        task.setInspector("运维工程师");
        inspectionMapper.updateById(task);
        return R.ok(toVO(task));
    }

    @Operation(summary = "提交巡检结果") @PostMapping("/{id}/submit")
    public R<InspectionTaskVO> submit(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        InspectionTaskEntity task = inspectionMapper.selectById(id);
        if (task == null) return R.fail(4000, "巡检任务不存在");
        task.setStatus("completed");
        task.setCompleteTime(LocalDateTime.now());
        inspectionMapper.updateById(task);
        return R.ok(toVO(task));
    }

    private InspectionTaskVO toVO(InspectionTaskEntity e) {
        return InspectionTaskVO.builder()
                .id(String.valueOf(e.getId())).name(e.getName()).stationName(e.getStationName())
                .deviceCount(e.getDeviceCount()).itemCount(e.getItemCount())
                .status(e.getStatus()).inspector(e.getInspector())
                .planTime(e.getPlanTime()).startTime(e.getStartTime()).completeTime(e.getCompleteTime())
                .build();
    }
}
