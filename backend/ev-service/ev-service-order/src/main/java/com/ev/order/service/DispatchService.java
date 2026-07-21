package com.ev.order.service;

import com.ev.common.core.dto.PageQuery;
import com.ev.common.core.result.PageResult;
import com.ev.order.dto.DispatchRuleVO;
import com.ev.order.dto.DispatchRecordVO;
import com.ev.order.dto.OperatorVO;

import java.util.List;

public interface DispatchService {

    /**
     * 分页查询调度规则列表
     */
    PageResult<DispatchRuleVO> rulePage(PageQuery query);

    /**
     * 调度规则详情
     */
    DispatchRuleVO ruleDetail(Long id);

    /**
     * 分页查询调度记录列表
     */
    PageResult<DispatchRecordVO> recordPage(PageQuery query);

    /**
     * 可用运维人员列表
     */
    List<OperatorVO> operators();
}
