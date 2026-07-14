package com.ev.order.service;
import com.ev.common.core.result.PageResult;
import com.ev.order.dto.*;
import com.ev.common.core.dto.PageQuery;

public interface FinanceService {
    FinanceSummaryVO summary(String startTime, String endTime);
    PageResult<OrderVO> bills(PageQuery query);
    PageResult<OrderVO> settlements(PageQuery query);
}
