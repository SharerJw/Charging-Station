package com.ev.order.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.ev.common.mybatis.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;

/**
 * 每周统计报表实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("weekly_statistics")
public class WeeklyStatisticsEntity extends BaseEntity {

    /** 周开始日期 */
    private LocalDate weekStart;

    /** 周结束日期 */
    private LocalDate weekEnd;

    /** 总订单数 */
    private Long totalOrders;

    /** 已完成订单数 */
    private Long completedOrders;

    /** 已取消订单数 */
    private Long cancelledOrders;

    /** 异常订单数 */
    private Long abnormalOrders;

    /** 已退款订单数 */
    private Long refundedOrders;

    /** 总金额（分） */
    private Long totalAmount;

    /** 总电量（Wh） */
    private Long totalEnergyWh;
}
