package com.ev.station.service;
import com.ev.common.core.result.PageResult;
import com.ev.station.dto.*;
import java.util.List;

public interface StationService {
    PageResult<StationVO> page(StationQuery query);
    StationVO detail(Long id);
    StationVO create(StationCreateReq req);
    StationVO update(Long id, StationCreateReq req);
    void delete(Long id);
    void updateStatus(Long id, String status);
    List<StationVO> search(String keyword);
}
