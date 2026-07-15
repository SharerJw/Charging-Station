package com.ev.station.dto;

import com.ev.common.core.dto.PageQuery;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 设备分页查询
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class DeviceQuery extends PageQuery {

    /** 设备名称/编码关键词 */
    private String keyword;

    /** 站点ID */
    private Long stationId;

    /** 设备状态 */
    private String status;
}
