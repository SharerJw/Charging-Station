package com.ev.order.service;
import com.ev.common.core.result.PageResult;
import com.ev.order.dto.*;
import java.util.List;

public interface DashboardService {
    DashboardStatsVO stats();
    ChartDataVO chart(Integer days);
    List<OrderVO> recentOrders(Integer limit);
    List<AlertVO> alerts(Integer limit);
    List<StationRankVO> stationRank(Integer limit, String sortBy);
}
