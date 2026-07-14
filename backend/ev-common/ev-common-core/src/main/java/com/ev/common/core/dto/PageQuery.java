package com.ev.common.core.dto;

import lombok.Data;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.io.Serializable;

/**
 * 分页查询基类
 */
@Data
public class PageQuery implements Serializable {

    private static final long serialVersionUID = 1L;

    /** 当前页码，默认1 */
    @Min(value = 1, message = "页码最小为1")
    private int page = 1;

    /** 每页大小，默认20 */
    @Min(value = 1, message = "每页大小最小为1")
    @Max(value = 100, message = "每页大小最大为100")
    private int size = 20;

    /** 排序字段 */
    private String sortBy;

    /** 排序方向：asc/desc */
    private String sortOrder = "desc";

    /** 计算偏移量 */
    public long getOffset() {
        return (long) (page - 1) * size;
    }
}
