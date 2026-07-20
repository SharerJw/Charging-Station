package com.ev.order.task;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ev.order.entity.ChargingOrderEntity;
import com.ev.order.entity.DailyStatisticsEntity;
import com.ev.order.entity.MonthlyStatisticsEntity;
import com.ev.order.entity.WeeklyStatisticsEntity;
import com.ev.order.mapper.ChargingOrderMapper;
import com.ev.order.mapper.DailyStatisticsMapper;
import com.ev.order.mapper.MonthlyStatisticsMapper;
import com.ev.order.mapper.WeeklyStatisticsMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * 统计报表定时任务
 * 生成每日、每周、每月订单统计数据
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class StatisticsTask {

    private final ChargingOrderMapper orderMapper;
    private final DailyStatisticsMapper dailyStatisticsMapper;
    private final WeeklyStatisticsMapper weeklyStatisticsMapper;
    private final MonthlyStatisticsMapper monthlyStatisticsMapper;

    /**
     * 每日统计 - 每天凌晨3点执行
     * 统计前一天的订单数据
     */
    @Scheduled(cron = "0 0 3 * * ?")
    public void generateDailyStats() {
        // 计算统计时间范围：昨天 00:00:00 ~ 23:59:59
        LocalDateTime startTime = LocalDateTime.now().minusDays(1).with(LocalTime.MIN);
        LocalDateTime endTime = LocalDateTime.now().minusDays(1).with(LocalTime.MAX);

        // 查询昨日订单
        List<ChargingOrderEntity> orders = orderMapper.selectList(
                new LambdaQueryWrapper<ChargingOrderEntity>()
                        .between(ChargingOrderEntity::getCreatedAt, startTime, endTime));

        if (orders.isEmpty()) {
            log.info("每日统计：昨日（{}）无订单数据", startTime.toLocalDate());
            return;
        }

        // 统计指标
        long totalOrders = orders.size();
        long completedOrders = orders.stream()
                .filter(o -> "PAID".equals(o.getStatus()))
                .count();
        long totalAmount = orders.stream()
                .mapToLong(o -> o.getTotalAmount() != null ? o.getTotalAmount() : 0L)
                .sum();
        long totalEnergyWh = orders.stream()
                .mapToLong(o -> o.getEnergyWh() != null ? o.getEnergyWh() : 0L)
                .sum();

        // 按状态分布统计
        long cancelledOrders = orders.stream()
                .filter(o -> "CANCELLED".equals(o.getStatus()))
                .count();
        long abnormalOrders = orders.stream()
                .filter(o -> "ABNORMAL".equals(o.getStatus()))
                .count();
        long refundedOrders = orders.stream()
                .filter(o -> "REFUNDED".equals(o.getStatus()))
                .count();

        log.info("每日统计报表（{}）：" +
                        "总订单={}, 已完成={}, 已取消={}, 异常={}, 已退款={}, " +
                        "总金额={}分({}元), 总电量={}Wh({}kWh)",
                startTime.toLocalDate(),
                totalOrders, completedOrders, cancelledOrders, abnormalOrders, refundedOrders,
                totalAmount, String.format("%.2f", totalAmount / 100.0),
                totalEnergyWh, String.format("%.2f", totalEnergyWh / 1000.0));

        // 持久化到统计报表表
        DailyStatisticsEntity entity = new DailyStatisticsEntity();
        entity.setStatDate(startTime.toLocalDate());
        entity.setTotalOrders(totalOrders);
        entity.setCompletedOrders(completedOrders);
        entity.setCancelledOrders(cancelledOrders);
        entity.setAbnormalOrders(abnormalOrders);
        entity.setRefundedOrders(refundedOrders);
        entity.setTotalAmount(totalAmount);
        entity.setTotalEnergyWh(totalEnergyWh);
        dailyStatisticsMapper.insert(entity);
        log.info("每日统计报表已持久化，statDate={}", startTime.toLocalDate());
    }

    /**
     * 每周统计 - 每周一凌晨4点执行
     * 统计上一周的订单数据
     */
    @Scheduled(cron = "0 0 4 ? * MON")
    public void generateWeeklyStats() {
        LocalDateTime startTime = LocalDateTime.now().minusWeeks(1).with(LocalTime.MIN);
        LocalDateTime endTime = LocalDateTime.now().minusDays(1).with(LocalTime.MAX);

        List<ChargingOrderEntity> orders = orderMapper.selectList(
                new LambdaQueryWrapper<ChargingOrderEntity>()
                        .between(ChargingOrderEntity::getCreatedAt, startTime, endTime));

        if (orders.isEmpty()) {
            log.info("每周统计：上周（{} ~ {}）无订单数据",
                    startTime.toLocalDate(), endTime.toLocalDate());
            return;
        }

        long totalOrders = orders.size();
        long completedOrders = orders.stream()
                .filter(o -> "PAID".equals(o.getStatus()))
                .count();
        long totalAmount = orders.stream()
                .mapToLong(o -> o.getTotalAmount() != null ? o.getTotalAmount() : 0L)
                .sum();
        long totalEnergyWh = orders.stream()
                .mapToLong(o -> o.getEnergyWh() != null ? o.getEnergyWh() : 0L)
                .sum();

        // 计算日均
        long days = java.time.temporal.ChronoUnit.DAYS.between(startTime.toLocalDate(), endTime.toLocalDate()) + 1;
        double avgDailyOrders = (double) totalOrders / days;
        double avgDailyAmount = totalAmount / 100.0 / days;

        log.info("每周统计报表（{} ~ {}）：" +
                        "总订单={}, 已完成={}, 日均订单={}, " +
                        "总金额={}元, 日均金额={}元, 总电量={}kWh",
                startTime.toLocalDate(), endTime.toLocalDate(),
                totalOrders, completedOrders, String.format("%.1f", avgDailyOrders),
                String.format("%.2f", totalAmount / 100.0), String.format("%.2f", avgDailyAmount),
                String.format("%.2f", totalEnergyWh / 1000.0));

        // 持久化到统计报表表
        WeeklyStatisticsEntity entity = new WeeklyStatisticsEntity();
        entity.setWeekStart(startTime.toLocalDate());
        entity.setWeekEnd(endTime.toLocalDate());
        entity.setTotalOrders(totalOrders);
        entity.setCompletedOrders(completedOrders);
        entity.setCancelledOrders(orders.stream().filter(o -> "CANCELLED".equals(o.getStatus())).count());
        entity.setAbnormalOrders(orders.stream().filter(o -> "ABNORMAL".equals(o.getStatus())).count());
        entity.setRefundedOrders(orders.stream().filter(o -> "REFUNDED".equals(o.getStatus())).count());
        entity.setTotalAmount(totalAmount);
        entity.setTotalEnergyWh(totalEnergyWh);
        weeklyStatisticsMapper.insert(entity);
        log.info("每周统计报表已持久化，weekStart={}, weekEnd={}", startTime.toLocalDate(), endTime.toLocalDate());
    }

    /**
     * 每月统计 - 每月1号凌晨5点执行
     * 统计上一个月的订单数据
     */
    @Scheduled(cron = "0 0 5 1 * ?")
    public void generateMonthlyStats() {
        LocalDateTime startTime = LocalDateTime.now().minusMonths(1).withDayOfMonth(1).with(LocalTime.MIN);
        LocalDateTime endTime = LocalDateTime.now().withDayOfMonth(1).with(LocalTime.MIN).minusSeconds(1);

        List<ChargingOrderEntity> orders = orderMapper.selectList(
                new LambdaQueryWrapper<ChargingOrderEntity>()
                        .between(ChargingOrderEntity::getCreatedAt, startTime, endTime));

        if (orders.isEmpty()) {
            log.info("每月统计：上月（{}）无订单数据", startTime.toLocalDate());
            return;
        }

        long totalOrders = orders.size();
        long completedOrders = orders.stream()
                .filter(o -> "PAID".equals(o.getStatus()))
                .count();
        long totalAmount = orders.stream()
                .mapToLong(o -> o.getTotalAmount() != null ? o.getTotalAmount() : 0L)
                .sum();
        long totalEnergyWh = orders.stream()
                .mapToLong(o -> o.getEnergyWh() != null ? o.getEnergyWh() : 0L)
                .sum();

        log.info("每月统计报表（{}）：" +
                        "总订单={}, 已完成={}, " +
                        "总金额={}元, 总电量={}kWh",
                startTime.toLocalDate().getMonth(),
                totalOrders, completedOrders,
                totalAmount / 100.0,
                totalEnergyWh / 1000.0);

        // 持久化到统计报表表
        MonthlyStatisticsEntity entity = new MonthlyStatisticsEntity();
        entity.setYear(startTime.getYear());
        entity.setMonth(startTime.getMonthValue());
        entity.setTotalOrders(totalOrders);
        entity.setCompletedOrders(completedOrders);
        entity.setCancelledOrders(orders.stream().filter(o -> "CANCELLED".equals(o.getStatus())).count());
        entity.setAbnormalOrders(orders.stream().filter(o -> "ABNORMAL".equals(o.getStatus())).count());
        entity.setRefundedOrders(orders.stream().filter(o -> "REFUNDED".equals(o.getStatus())).count());
        entity.setTotalAmount(totalAmount);
        entity.setTotalEnergyWh(totalEnergyWh);
        monthlyStatisticsMapper.insert(entity);
        log.info("每月统计报表已持久化，year={}, month={}", startTime.getYear(), startTime.getMonthValue());
    }
}
