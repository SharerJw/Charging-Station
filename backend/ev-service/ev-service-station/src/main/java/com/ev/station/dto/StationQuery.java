package com.ev.station.dto;
import com.ev.common.core.dto.PageQuery;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data @EqualsAndHashCode(callSuper = true)
public class StationQuery extends PageQuery {
    private String keyword;
    private String status;
    private String city;
}
