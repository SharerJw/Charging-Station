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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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

    @Override
    public WorkOrderVO detail(Long id) {
        WorkOrderEntity wo = workOrderMapper.selectById(id);
        if (wo == null) {
            throw BizException.of(3000, "工单不存在");
        }
        return toVO(wo);
    }

    @Override
    @Transactional
    public WorkOrderVO create(String title, String description, String type, String priority, String stationName, String deviceCode) {
        WorkOrderEntity wo = new WorkOrderEntity();
        wo.setOrderNo("WO" + System.currentTimeMillis());
        wo.setTitle(title);
        wo.setDescription(description);
        wo.setType(type);
        wo.setPriority(priority);
        wo.setStationName(stationName);
        wo.setDeviceCode(deviceCode);
        wo.setStatus("pending");
        wo.setCreator("运维工程师");
        workOrderMapper.insert(wo);
        log.info("工单已创建: workOrderId={}, orderNo={}", wo.getId(), wo.getOrderNo());
        return toVO(wo);
    }

    @Override
    @Transactional
    public WorkOrderVO assign(Long id, String assignee) {
        WorkOrderEntity wo = workOrderMapper.selectById(id);
        if (wo == null) {
            throw BizException.of(3000, "工单不存在");
        }
        wo.setAssignee(assignee);
        workOrderMapper.updateById(wo);
        log.info("工单已分配: workOrderId={}, assignee={}", id, assignee);
        return toVO(wo);
    }

    @Override
    public Map<String, Object> statistics() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalOrders", workOrderMapper.selectCount(null));

        LambdaQueryWrapper<WorkOrderEntity> pendingWrapper = new LambdaQueryWrapper<>();
        pendingWrapper.eq(WorkOrderEntity::getStatus, "pending");
        stats.put("pendingOrders", workOrderMapper.selectCount(pendingWrapper));

        LambdaQueryWrapper<WorkOrderEntity> acceptedWrapper = new LambdaQueryWrapper<>();
        acceptedWrapper.eq(WorkOrderEntity::getStatus, "accepted");
        stats.put("acceptedOrders", workOrderMapper.selectCount(acceptedWrapper));

        LambdaQueryWrapper<WorkOrderEntity> completedWrapper = new LambdaQueryWrapper<>();
        completedWrapper.eq(WorkOrderEntity::getStatus, "completed");
        stats.put("completedOrders", workOrderMapper.selectCount(completedWrapper));

        return stats;
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
