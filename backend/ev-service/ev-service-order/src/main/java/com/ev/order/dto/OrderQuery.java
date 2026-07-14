package com.ev.order.dto;
import com.ev.common.core.dto.PageQuery;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data @EqualsAndHashCode(callSuper = true)
public class OrderQuery extends PageQuery {
    private String orderNo; private String status; private Long stationId; private Long userId;
    private String startTime; private String endTime;
}
