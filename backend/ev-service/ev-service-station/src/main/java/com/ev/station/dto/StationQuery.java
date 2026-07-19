package com.ev.station.dto;
import com.ev.common.core.dto.PageQuery;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data @EqualsAndHashCode(callSuper = true)
public class StationQuery extends PageQuery {
    private String keyword;
    private String status;
    private String city;
    private Double latitude;
    private Double longitude;
    private Double radius; // 单位：km，可选。不传则不限制距离
    private String sort;   // 排序方式：DISTANCE(距离最近) / PRICE(价格最低) / SMART(智能推荐)，默认 DISTANCE
}
