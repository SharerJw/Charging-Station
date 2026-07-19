package com.ev.order.statemachine;

import com.ev.common.core.exception.BizException;
import com.ev.order.entity.ChargingOrderEntity;
import com.ev.order.entity.OrderStatusHistoryEntity;
import com.ev.order.mapper.OrderStatusHistoryMapper;
import com.ev.order.statemachine.handler.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * 订单状态机单元测试
 * 覆盖正常流程、异常流程、终态处理、历史记录等场景
 */
@ExtendWith(MockitoExtension.class)
class OrderStateMachineTest {

    @Mock
    private OrderStatusHistoryMapper statusHistoryMapper;

    private OrderStateMachine stateMachine;

    @BeforeEach
    void setUp() {
        // 通过注入所有 handler 创建状态机
        List<OrderStateHandler> handlers = List.of(
                new CreatedStateHandler(),
                new ChargingStateHandler(),
                new StoppingStateHandler(),
                new StoppedStateHandler(),
                new SettlingStateHandler(),
                new SettledStateHandler(),
                new PayingStateHandler(),
                new PaidStateHandler(),
                new RefundingStateHandler(),
                new RefundedStateHandler(),
                new CancelledStateHandler(),
                new AbnormalStateHandler()
        );
        stateMachine = new OrderStateMachine(handlers, statusHistoryMapper);
    }

    /**
     * 测试1：正常充电全流程
     * CREATED → CHARGING → STOPPING → STOPPED → SETTLING → SETTLED → PAYING → PAID
     */
    @Test
    void testNormalChargingFlow() {
        // Given
        ChargingOrderEntity order = createOrder(OrderStatus.CREATED);

        // When & Then
        OrderStatus result = stateMachine.fire(order, OrderEvent.START_CHARGING);
        assertThat(result).isEqualTo(OrderStatus.CHARGING);
        assertThat(order.getStatus()).isEqualTo("CHARGING");

        result = stateMachine.fire(order, OrderEvent.STOP_CHARGING);
        assertThat(result).isEqualTo(OrderStatus.STOPPING);
        assertThat(order.getStatus()).isEqualTo("STOPPING");

        result = stateMachine.fire(order, OrderEvent.CHARGING_STOPPED);
        assertThat(result).isEqualTo(OrderStatus.STOPPED);
        assertThat(order.getStatus()).isEqualTo("STOPPED");

        result = stateMachine.fire(order, OrderEvent.SETTLE);
        assertThat(result).isEqualTo(OrderStatus.SETTLING);
        assertThat(order.getStatus()).isEqualTo("SETTLING");

        result = stateMachine.fire(order, OrderEvent.SETTLED);
        assertThat(result).isEqualTo(OrderStatus.SETTLED);
        assertThat(order.getStatus()).isEqualTo("SETTLED");

        result = stateMachine.fire(order, OrderEvent.PAY);
        assertThat(result).isEqualTo(OrderStatus.PAYING);
        assertThat(order.getStatus()).isEqualTo("PAYING");

        result = stateMachine.fire(order, OrderEvent.PAID);
        assertThat(result).isEqualTo(OrderStatus.PAID);
        assertThat(order.getStatus()).isEqualTo("PAID");

        // 验证状态历史记录被调用
        verify(statusHistoryMapper, times(7)).insert(any(OrderStatusHistoryEntity.class));
    }

    /**
     * 测试2：用户取消订单
     * CREATED → CANCELLED
     */
    @Test
    void testCancelOrder() {
        // Given
        ChargingOrderEntity order = createOrder(OrderStatus.CREATED);

        // When
        OrderStatus result = stateMachine.fire(order, OrderEvent.CANCEL);

        // Then
        assertThat(result).isEqualTo(OrderStatus.CANCELLED);
        assertThat(order.getStatus()).isEqualTo("CANCELLED");
    }

    /**
     * 测试3：充电中不能取消
     * CHARGING + CANCEL → 抛出 BizException
     */
    @Test
    void testCannotCancelWhileCharging() {
        // Given
        ChargingOrderEntity order = createOrder(OrderStatus.CHARGING);

        // When & Then
        assertThatThrownBy(() -> stateMachine.fire(order, OrderEvent.CANCEL))
                .isInstanceOf(BizException.class)
                .satisfies(ex -> {
                    BizException bizEx = (BizException) ex;
                    assertThat(bizEx.getCode()).isEqualTo(3001); // ORDER_STATUS_ABNORMAL
                });
    }

    /**
     * 测试4：退款流程
     * PAID → REFUNDING → REFUNDED
     */
    @Test
    void testRefundFlow() {
        // Given
        ChargingOrderEntity order = createOrder(OrderStatus.PAID);

        // When & Then
        OrderStatus result = stateMachine.fire(order, OrderEvent.REFUND);
        assertThat(result).isEqualTo(OrderStatus.REFUNDING);
        assertThat(order.getStatus()).isEqualTo("REFUNDING");

        result = stateMachine.fire(order, OrderEvent.REFUNDED);
        assertThat(result).isEqualTo(OrderStatus.REFUNDED);
        assertThat(order.getStatus()).isEqualTo("REFUNDED");
    }

    /**
     * 测试5：退款失败回退
     * REFUNDING + ABNORMAL → 回到 PAID
     */
    @Test
    void testRefundFailedRollback() {
        // Given
        ChargingOrderEntity order = createOrder(OrderStatus.REFUNDING);

        // When
        OrderStatus result = stateMachine.fire(order, OrderEvent.ABNORMAL);

        // Then
        assertThat(result).isEqualTo(OrderStatus.PAID);
        assertThat(order.getStatus()).isEqualTo("PAID");
    }

    /**
     * 测试6：充电异常
     * CHARGING → ABNORMAL
     */
    @Test
    void testChargingAbnormal() {
        // Given
        ChargingOrderEntity order = createOrder(OrderStatus.CHARGING);

        // When
        OrderStatus result = stateMachine.fire(order, OrderEvent.ABNORMAL);

        // Then
        assertThat(result).isEqualTo(OrderStatus.ABNORMAL);
        assertThat(order.getStatus()).isEqualTo("ABNORMAL");
    }

    /**
     * 测试7：终态不接受事件
     * CANCELLED + START_CHARGING → 抛出 BizException
     */
    @Test
    void testTerminalStateRejectsEvents() {
        // Given
        ChargingOrderEntity orderCancelled = createOrder(OrderStatus.CANCELLED);
        ChargingOrderEntity orderRefunded = createOrder(OrderStatus.REFUNDED);
        ChargingOrderEntity orderAbnormal = createOrder(OrderStatus.ABNORMAL);

        // When & Then - CANCELLED 状态
        assertThatThrownBy(() -> stateMachine.fire(orderCancelled, OrderEvent.START_CHARGING))
                .isInstanceOf(BizException.class);

        // When & Then - REFUNDED 状态
        assertThatThrownBy(() -> stateMachine.fire(orderRefunded, OrderEvent.PAY))
                .isInstanceOf(BizException.class);

        // When & Then - ABNORMAL 状态
        assertThatThrownBy(() -> stateMachine.fire(orderAbnormal, OrderEvent.STOP_CHARGING))
                .isInstanceOf(BizException.class);
    }

    /**
     * 测试8：无效状态转换
     * CREATED + REFUND → 抛出 BizException
     */
    @Test
    void testInvalidStateTransition() {
        // Given
        ChargingOrderEntity order = createOrder(OrderStatus.CREATED);

        // When & Then
        assertThatThrownBy(() -> stateMachine.fire(order, OrderEvent.REFUND))
                .isInstanceOf(BizException.class);
    }

    /**
     * 测试9：状态历史记录
     * 验证 fire() 后状态历史被正确记录
     */
    @Test
    void testStatusHistoryRecording() {
        // Given
        ChargingOrderEntity order = createOrder(OrderStatus.CREATED);
        order.setId(12345L);

        // When
        stateMachine.fire(order, OrderEvent.START_CHARGING);

        // Then
        ArgumentCaptor<OrderStatusHistoryEntity> captor = ArgumentCaptor.forClass(OrderStatusHistoryEntity.class);
        verify(statusHistoryMapper, times(1)).insert(captor.capture());

        OrderStatusHistoryEntity history = captor.getValue();
        assertThat(history.getOrderId()).isEqualTo(12345L);
        assertThat(history.getFromStatus()).isEqualTo("CREATED");
        assertThat(history.getToStatus()).isEqualTo("CHARGING");
        assertThat(history.getTriggerType()).isEqualTo("START_CHARGING");
    }

    /**
     * 测试10：验证 isValidTransition 方法
     */
    @Test
    void testIsValidTransition() {
        // 合法转换
        assertThat(stateMachine.isValidTransition(OrderStatus.CREATED, OrderEvent.START_CHARGING)).isTrue();
        assertThat(stateMachine.isValidTransition(OrderStatus.CREATED, OrderEvent.CANCEL)).isTrue();
        assertThat(stateMachine.isValidTransition(OrderStatus.CHARGING, OrderEvent.STOP_CHARGING)).isTrue();
        assertThat(stateMachine.isValidTransition(OrderStatus.CHARGING, OrderEvent.ABNORMAL)).isTrue();
        assertThat(stateMachine.isValidTransition(OrderStatus.PAID, OrderEvent.REFUND)).isTrue();

        // 非法转换
        assertThat(stateMachine.isValidTransition(OrderStatus.CREATED, OrderEvent.REFUND)).isFalse();
        assertThat(stateMachine.isValidTransition(OrderStatus.CHARGING, OrderEvent.CANCEL)).isFalse();
        assertThat(stateMachine.isValidTransition(OrderStatus.PAID, OrderEvent.START_CHARGING)).isFalse();

        // 终态转换
        assertThat(stateMachine.isValidTransition(OrderStatus.CANCELLED, OrderEvent.START_CHARGING)).isFalse();
        assertThat(stateMachine.isValidTransition(OrderStatus.REFUNDED, OrderEvent.PAY)).isFalse();
        assertThat(stateMachine.isValidTransition(OrderStatus.ABNORMAL, OrderEvent.STOP_CHARGING)).isFalse();
    }

    /**
     * 辅助方法：创建指定状态的订单实体
     */
    private ChargingOrderEntity createOrder(OrderStatus status) {
        ChargingOrderEntity order = new ChargingOrderEntity();
        order.setId(1001L);
        order.setStatus(status.name());
        return order;
    }
}
