package com.ev.simulator.protocol;

import com.fasterxml.jackson.databind.JsonNode;

/**
 * OCPP-J 消息帧
 * CALL: [2, messageId, action, payload]
 * CALL_RESULT: [3, messageId, payload]
 * CALL_ERROR: [4, messageId, errorCode, errorDescription, details]
 */
public record OcppFrame(
    FrameType type,
    String messageId,
    String action,
    JsonNode payload,
    String errorCode,
    String errorDescription
) {
    public enum FrameType { CALL, CALL_RESULT, CALL_ERROR }

    public static OcppFrame call(String messageId, String action, JsonNode payload) {
        return new OcppFrame(FrameType.CALL, messageId, action, payload, null, null);
    }

    public static OcppFrame callResult(String messageId, JsonNode payload) {
        return new OcppFrame(FrameType.CALL_RESULT, messageId, null, payload, null, null);
    }

    public static OcppFrame callError(String messageId, String errorCode, String errorDescription, JsonNode details) {
        return new OcppFrame(FrameType.CALL_ERROR, messageId, null, details, errorCode, errorDescription);
    }
}
