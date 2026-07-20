package com.ev.order.service;

import com.ev.common.core.dto.PageQuery;
import com.ev.common.core.result.PageResult;
import com.ev.order.dto.AlertVO;

public interface AlertService {

    /**
     * 分页查询告警列表
     */
    PageResult<AlertVO> page(PageQuery query, String level, String status, String keyword);

    /**
     * 处理告警
     */
    AlertVO handle(Long id, String handler, String result);

    /**
     * 忽略告警
     */
    void ignore(Long id, String note);
}
