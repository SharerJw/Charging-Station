package com.ev.order.task;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ev.order.entity.ChargingOrderEntity;
import com.ev.order.mapper.ChargingOrderMapper;
import com.ev.order.statemachine.OrderEvent;
import com.ev.order.statemachine.OrderStateMachine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 订单定时任务
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrderScheduledTask {

    private final ChargingOrderMapper orderMapper;
    private final OrderStateMachine orderStateMachine;

    /**
     * 订单超时取消 - 每分钟执行
     * 将超过30分钟仍为 CREATED 状态的订单标记为 CANCELLED
     */
    @Scheduled(cron = "0 * * * * ?")
    public void cancelExpiredOrders() {
        LocalDateTime deadline = LocalDateTime.now().minusMinutes(30);

        // 查询需要取消的订单
        List<ChargingOrderEntity> expiredOrders = orderMapper.selectList(
                new LambdaQueryWrapper<ChargingOrderEntity>()
                        .eq(ChargingOrderEntity::getStatus, "CREATED")
                        .le(ChargingOrderEntity::getCreatedAt, deadline));

        if (!expiredOrders.isEmpty()) {
            for (ChargingOrderEntity order : expiredOrders) {
                try {
                    orderStateMachine.fire(order, OrderEvent.CANCEL);
                    orderMapper.updateById(order);
                } catch (Exception e) {
                    log.error("订单超时取消失败: orderId={}, error={}", order.getId(), e.getMessage());
                }
            }
            log.info("订单超时取消：本次取消 {} 笔 CREATED 状态订单（超时阈值30分钟）", expiredOrders.size());
        }
    }

    /**
     * 充电超时检测 - 每5分钟执行
     * 将充电超过24小时的订单标记为 ABNORMAL
     */
    @Scheduled(cron = "0 */5 * * * ?")
    public void checkTimeoutCharging() {
        LocalDateTime deadline = LocalDateTime.now().minusHours(24);

        // 查询需要标记为异常的订单
        List<ChargingOrderEntity> timeoutOrders = orderMapper.selectList(
                new LambdaQueryWrapper<ChargingOrderEntity>()
                        .eq(ChargingOrderEntity::getStatus, "CHARGING")
                        .le(ChargingOrderEntity::getStartTime, deadline));

        if (!timeoutOrders.isEmpty()) {
            for (ChargingOrderEntity order : timeoutOrders) {
                try {
                    orderStateMachine.fire(order, OrderEvent.ABNORMAL);
                    orderMapper.updateById(order);
                } catch (Exception e) {
                    log.error("充电超时检测失败: orderId={}, error={}", order.getId(), e.getMessage());
                }
            }
            log.info("充电超时检测：本次标记 {} 笔 CHARGING 状态订单为 ABNORMAL（超时阈值24小时）", timeoutOrders.size());
        }
    }
}
