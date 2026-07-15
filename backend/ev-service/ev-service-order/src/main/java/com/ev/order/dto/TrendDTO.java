package com.ev.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TrendDTO {
    private Double daily;   // 日环比百分比
    private Double weekly;  // 周同比百分比
}
