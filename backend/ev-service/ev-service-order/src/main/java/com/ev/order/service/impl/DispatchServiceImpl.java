package com.ev.order.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ev.common.core.dto.PageQuery;
import com.ev.common.core.exception.BizException;
import com.ev.common.core.result.PageResult;
import com.ev.order.dto.DispatchRecordVO;
import com.ev.order.dto.DispatchRuleVO;
import com.ev.order.dto.OperatorVO;
import com.ev.order.entity.DispatchRecordEntity;
import com.ev.order.entity.DispatchRuleEntity;
import com.ev.order.mapper.DispatchRecordMapper;
import com.ev.order.mapper.DispatchRuleMapper;
import com.ev.order.service.DispatchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DispatchServiceImpl implements DispatchService {

    private final DispatchRuleMapper dispatchRuleMapper;
    private final DispatchRecordMapper dispatchRecordMapper;

    @Override
    public PageResult<DispatchRuleVO> rulePage(PageQuery query) {
        LambdaQueryWrapper<DispatchRuleEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByDesc(DispatchRuleEntity::getCreatedAt);

        Page<DispatchRuleEntity> page = dispatchRuleMapper.selectPage(
                new Page<>(query.getPage(), query.getSize()), wrapper);
        List<DispatchRuleVO> voList = page.getRecords().stream()
                .map(this::toRuleVO).collect(Collectors.toList());
        return PageResult.of(voList, page.getTotal(), query.getPage(), query.getSize());
    }

    @Override
    public DispatchRuleVO ruleDetail(Long id) {
        DispatchRuleEntity rule = dispatchRuleMapper.selectById(id);
        if (rule == null) {
            throw BizException.of(5001, "调度规则不存在");
        }
        return toRuleVO(rule);
    }

    @Override
    public PageResult<DispatchRecordVO> recordPage(PageQuery query) {
        LambdaQueryWrapper<DispatchRecordEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByDesc(DispatchRecordEntity::getCreatedAt);

        Page<DispatchRecordEntity> page = dispatchRecordMapper.selectPage(
                new Page<>(query.getPage(), query.getSize()), wrapper);
        List<DispatchRecordVO> voList = page.getRecords().stream()
                .map(this::toRecordVO).collect(Collectors.toList());
        return PageResult.of(voList, page.getTotal(), query.getPage(), query.getSize());
    }

    @Override
    public List<OperatorVO> operators() {
        return List.of(
                OperatorVO.builder().id("1").name("张伟").phone("138****1001").role("运维工程师").currentTaskCount(2).build(),
                OperatorVO.builder().id("2").name("李强").phone("138****1002").role("运维工程师").currentTaskCount(1).build(),
                OperatorVO.builder().id("3").name("王磊").phone("138****1003").role("高级运维").currentTaskCount(3).build(),
                OperatorVO.builder().id("4").name("赵敏").phone("138****1004").role("运维主管").currentTaskCount(1).build(),
                OperatorVO.builder().id("5").name("刘洋").phone("138****1005").role("运维工程师").currentTaskCount(0).build()
        );
    }

    private DispatchRuleVO toRuleVO(DispatchRuleEntity e) {
        return DispatchRuleVO.builder()
                .id(String.valueOf(e.getId()))
                .name(e.getName())
                .description(e.getDescription())
                .ruleType(e.getRuleType())
                .priority(e.getPriority())
                .conditions(e.getConditions())
                .assigneePattern(e.getAssigneePattern())
                .enabled(e.getEnabled())
                .createTime(e.getCreatedAt())
                .updateTime(e.getUpdatedAt())
                .build();
    }

    private DispatchRecordVO toRecordVO(DispatchRecordEntity e) {
        return DispatchRecordVO.builder()
                .id(String.valueOf(e.getId()))
                .ruleId(String.valueOf(e.getRuleId()))
                .ruleName(e.getRuleName())
                .targetType(e.getTargetType())
                .targetId(e.getTargetId())
                .targetTitle(e.getTargetTitle())
                .assignee(e.getAssignee())
                .status(e.getStatus())
                .remark(e.getRemark())
                .createTime(e.getCreatedAt())
                .build();
    }
}
