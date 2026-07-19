package com.ev.order.task;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ev.order.entity.ChargingOrderEntity;
import com.ev.order.mapper.ChargingOrderMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

/**
 * 数据清理定时任务
 * 清理过期的已取消/已退款订单
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataCleanTask {

    private final ChargingOrderMapper orderMapper;

    /**
     * 清理过期的已取消/已退款订单 - 每天凌晨2点执行
     * 保留最近90天的数据
     */
    @Scheduled(cron = "0 0 2 * * ?")
    public void cleanExpiredData() {
        LocalDateTime deadline = LocalDateTime.now().minusDays(90);

        // 需要清理的订单状态：CANCELLED（已取消）、REFUNDED（已退款）
        List<String> cleanStatuses = Arrays.asList("CANCELLED", "REFUNDED");

        // 查询超过90天的已取消/已退款订单
        List<ChargingOrderEntity> expiredOrders = orderMapper.selectList(
                new LambdaQueryWrapper<ChargingOrderEntity>()
                        .in(ChargingOrderEntity::getStatus, cleanStatuses)
                        .le(ChargingOrderEntity::getCreatedAt, deadline));

        if (expiredOrders.isEmpty()) {
            log.info("数据清理任务：无过期订单需要清理（保留阈值：90天）");
            return;
        }

        // 批量逻辑删除（设置 deleted=1）
        int cleanedCount = 0;
        for (ChargingOrderEntity order : expiredOrders) {
            try {
                orderMapper.deleteById(order.getId());
                cleanedCount++;
            } catch (Exception e) {
                log.error("清理订单失败: orderId={}, error={}", order.getId(), e.getMessage());
            }
        }

        log.info("数据清理任务完成：清理 {} 笔过期订单（状态：CANCELLED/REFUNDED，保留阈值：90天）",
                cleanedCount);
    }

    /**
     * 清理过期的订单状态历史记录 - 每天凌晨2点30分执行
     * 保留最近180天的数据（比订单保留更久，便于审计追溯）
     */
    @Scheduled(cron = "0 30 2 * * ?")
    public void cleanExpiredStatusHistory() {
        LocalDateTime deadline = LocalDateTime.now().minusDays(180);

        // 查询已逻辑删除订单对应的状态历史
        // 这里简化处理：清理超过180天的所有状态历史
        // 实际生产环境可能需要关联订单表确认订单已删除
        log.info("订单状态历史清理任务：检查超过180天的历史记录");

        // 注意：此方法需要 OrderStatusHistoryMapper，当前注释避免编译错误
        // 如需启用，请注入 OrderStatusHistoryMapper 并实现具体逻辑
    }
}
