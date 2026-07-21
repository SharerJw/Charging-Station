package com.ev.order.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OperatorVO {
    private String id;
    private String name;
    private String phone;
    private String role;
    private Integer currentTaskCount;
}
