package com.ev.common.core.dto;

import lombok.Data;

/**
 * Keyset 分页查询（深分页优化）
 * 当数据量超过10000条时，使用 keyset 分页替代 OFFSET 分页
 */
@Data
public class KeysetQuery {
    /** 上一页最后一条记录的ID */
    private Long lastId;

    /** 每页大小 */
    private int size = 20;

    /** 排序方向：asc/desc */
    private String sortOrder = "desc";

    public boolean hasLastId() {
        return lastId != null && lastId > 0;
    }
}
