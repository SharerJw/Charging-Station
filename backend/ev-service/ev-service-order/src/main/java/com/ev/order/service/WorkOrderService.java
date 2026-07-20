package com.ev.order.service;

import com.ev.common.core.dto.PageQuery;
import com.ev.common.core.result.PageResult;
import com.ev.order.dto.WorkOrderVO;

public interface WorkOrderService {

    /**
     * 分页查询工单列表
     */
    PageResult<WorkOrderVO> page(PageQuery query, String status, String keyword);

    /**
     * 接单
     */
    WorkOrderVO accept(Long id, String assignee);

    /**
     * 完成工单
     */
    WorkOrderVO complete(Long id, String result);
}
