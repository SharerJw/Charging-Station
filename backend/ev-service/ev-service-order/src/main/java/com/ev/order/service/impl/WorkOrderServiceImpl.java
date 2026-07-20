package com.ev.order.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ev.common.core.dto.PageQuery;
import com.ev.common.core.exception.BizException;
import com.ev.common.core.result.PageResult;
import com.ev.order.dto.WorkOrderVO;
import com.ev.order.entity.WorkOrderEntity;
import com.ev.order.mapper.WorkOrderMapper;
import com.ev.order.service.WorkOrderService;
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
public class WorkOrderServiceImpl implements WorkOrderService {

    private final WorkOrderMapper workOrderMapper;

    @Override
    public PageResult<WorkOrderVO> page(PageQuery query, String status, String keyword) {
        LambdaQueryWrapper<WorkOrderEntity> wrapper = new LambdaQueryWrapper<>();
        if (status != null && !status.isBlank()) {
            wrapper.eq(WorkOrderEntity::getStatus, status);
        }
        if (keyword != null && !keyword.isBlank()) {
            wrapper.and(w -> w
                    .like(WorkOrderEntity::getTitle, keyword)
                    .or().like(WorkOrderEntity::getStationName, keyword)
                    .or().like(WorkOrderEntity::getDeviceCode, keyword));
        }
        wrapper.orderByDesc(WorkOrderEntity::getCreatedAt);

        Page<WorkOrderEntity> page = workOrderMapper.selectPage(
                new Page<>(query.getPage(), query.getSize()), wrapper);
        List<WorkOrderVO> voList = page.getRecords().stream()
                .map(this::toVO).collect(Collectors.toList());
        return PageResult.of(voList, page.getTotal(), query.getPage(), query.getSize());
    }

    @Override
    @Transactional
    public WorkOrderVO accept(Long id, String assignee) {
        WorkOrderEntity wo = workOrderMapper.selectById(id);
        if (wo == null) {
            throw BizException.of(3000, "工单不存在");
        }
        if (!"pending".equals(wo.getStatus())) {
            throw BizException.of(3001, "工单状态异常");
        }
        wo.setStatus("accepted");
        wo.setAssignee(assignee != null ? assignee : "运维工程师");
        wo.setAcceptTime(LocalDateTime.now());
        workOrderMapper.updateById(wo);
        log.info("工单已接单: workOrderId={}, assignee={}", id, wo.getAssignee());
        return toVO(wo);
    }

    @Override
    @Transactional
    public WorkOrderVO complete(Long id, String result) {
        WorkOrderEntity wo = workOrderMapper.selectById(id);
        if (wo == null) {
            throw BizException.of(3000, "工单不存在");
        }
        wo.setStatus("completed");
        wo.setResult(result != null ? result : "已完成");
        wo.setCompleteTime(LocalDateTime.now());
        workOrderMapper.updateById(wo);
        log.info("工单已完成: workOrderId={}", id);
        return toVO(wo);
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
