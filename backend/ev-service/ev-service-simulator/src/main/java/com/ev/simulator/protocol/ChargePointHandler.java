package com.ev.simulator.protocol;

/**
 * OCPP 消息处理器函数接口
 */
@FunctionalInterface
public interface ChargePointHandler {
    Object handle(String chargePointId, Object requestPayload, OcppSession session);
}
