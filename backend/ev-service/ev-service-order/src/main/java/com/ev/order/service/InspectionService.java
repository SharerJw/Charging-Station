package com.ev.order.service;

import com.ev.order.dto.InspectionTaskVO;

import java.util.List;

public interface InspectionService {

    /**
     * 查询巡检任务列表
     */
    List<InspectionTaskVO> list(String status);

    /**
     * 开始巡检
     */
    InspectionTaskVO start(Long id, String inspector);

    /**
     * 提交巡检结果
     */
    InspectionTaskVO submit(Long id, String result);

    /**
     * 巡检详情
     */
    InspectionTaskVO detail(Long id);
}
