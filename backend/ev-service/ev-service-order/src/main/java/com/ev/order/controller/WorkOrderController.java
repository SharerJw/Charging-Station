package com.ev.order.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ev.common.core.result.R;
import com.ev.order.entity.WorkOrderEntity;
import com.ev.order.dto.WorkOrderVO;
import com.ev.order.mapper.WorkOrderMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Tag(name = "运维端-工单") @RestController @RequestMapping("/api/v1/ops/workorders") @RequiredArgsConstructor
public class WorkOrderController {
    private final WorkOrderMapper workOrderMapper;

    @Operation(summary = "工单列表") @GetMapping
    public R<List<WorkOrderVO>> list(@RequestParam(required = false) String status) {
        LambdaQueryWrapper<WorkOrderEntity> wrapper = new LambdaQueryWrapper<>();
        if (status != null && !status.isBlank()) wrapper.eq(WorkOrderEntity::getStatus, status);
        wrapper.orderByDesc(WorkOrderEntity::getCreatedAt);
        return R.ok(workOrderMapper.selectList(wrapper).stream().map(this::toVO).collect(Collectors.toList()));
    }

    @Operation(summary = "接单") @PostMapping("/{id}/accept")
    public R<WorkOrderVO> accept(@PathVariable Long id) {
        WorkOrderEntity wo = workOrderMapper.selectById(id);
        if (wo == null) return R.fail(3000, "工单不存在");
        if (!"pending".equals(wo.getStatus())) return R.fail(3001, "工单状态异常");
        wo.setStatus("accepted");
        wo.setAssignee("运维工程师");
        wo.setAcceptTime(LocalDateTime.now());
        workOrderMapper.updateById(wo);
        return R.ok(toVO(wo));
    }

    @Operation(summary = "完成工单") @PostMapping("/{id}/complete")
    public R<WorkOrderVO> complete(@PathVariable Long id, @RequestBody Map<String, String> body) {
        WorkOrderEntity wo = workOrderMapper.selectById(id);
        if (wo == null) return R.fail(3000, "工单不存在");
        wo.setStatus("completed");
        wo.setResult(body.getOrDefault("result", "已完成"));
        wo.setCompleteTime(LocalDateTime.now());
        workOrderMapper.updateById(wo);
        return R.ok(toVO(wo));
    }

    private WorkOrderVO toVO(WorkOrderEntity e) {
        return WorkOrderVO.builder()
                .id(String.valueOf(e.getId())).orderNo(e.getOrderNo()).type(e.getType())
                .title(e.getTitle()).description(e.getDescription())
                .stationName(e.getStationName()).deviceCode(e.getDeviceCode())
                .priority(e.getPriority()).status(e.getStatus())
                .creator(e.getCreator()).assignee(e.getAssignee()).result(e.getResult())
                .createTime(e.getCreatedAt()).acceptTime(e.getAcceptTime()).completeTime(e.getCompleteTime())
                .build();
    }
}
