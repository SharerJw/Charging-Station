package com.ev.order.service;

import com.ev.common.core.dto.PageQuery;
import com.ev.common.core.result.PageResult;
import com.ev.order.dto.WorkOrderVO;

import java.util.Map;

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

    /**
     * 工单详情
     */
    WorkOrderVO detail(Long id);

    /**
     * 创建工单
     */
    WorkOrderVO create(String title, String description, String type, String priority, String stationName, String deviceCode);

    /**
     * 分配工单
     */
    WorkOrderVO assign(Long id, String assignee);

    /**
     * 工单统计
     */
    Map<String, Object> statistics();
}
