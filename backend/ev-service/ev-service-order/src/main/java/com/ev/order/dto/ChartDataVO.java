package com.ev.order.dto;
import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data @Builder
public class ChartDataVO {
    private List<String> dates; private List<Integer> orderCounts;
    private List<Long> revenues; private List<Long> energies;
}
