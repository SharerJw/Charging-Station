package com.ev.order.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ev.common.core.exception.BizException;
import com.ev.order.dto.InspectionTaskVO;
import com.ev.order.entity.InspectionTaskEntity;
import com.ev.order.mapper.InspectionTaskMapper;
import com.ev.order.service.InspectionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InspectionServiceImpl implements InspectionService {

    private final InspectionTaskMapper inspectionTaskMapper;

    @Override
    public List<InspectionTaskVO> list(String status) {
        LambdaQueryWrapper<InspectionTaskEntity> wrapper = new LambdaQueryWrapper<>();
        if (status != null && !status.isBlank()) {
            wrapper.eq(InspectionTaskEntity::getStatus, status);
        }
        wrapper.orderByDesc(InspectionTaskEntity::getCreatedAt);
        return inspectionTaskMapper.selectList(wrapper).stream()
                .map(this::toVO).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public InspectionTaskVO start(Long id, String inspector) {
        InspectionTaskEntity task = inspectionTaskMapper.selectById(id);
        if (task == null) {
            throw BizException.of(4000, "巡检任务不存在");
        }
        task.setStatus("in_progress");
        task.setStartTime(LocalDateTime.now());
        task.setInspector(inspector != null ? inspector : "运维工程师");
        inspectionTaskMapper.updateById(task);
        log.info("巡检已开始: taskId={}, inspector={}", id, task.getInspector());
        return toVO(task);
    }

    @Override
    @Transactional
    public InspectionTaskVO submit(Long id, String result) {
        InspectionTaskEntity task = inspectionTaskMapper.selectById(id);
        if (task == null) {
            throw BizException.of(4000, "巡检任务不存在");
        }
        task.setStatus("completed");
        task.setCompleteTime(LocalDateTime.now());
        inspectionTaskMapper.updateById(task);
        log.info("巡检已提交: taskId={}", id);
        return toVO(task);
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
