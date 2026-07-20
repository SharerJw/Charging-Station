package com.ev.simulator.protocol;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * OCPP-J 消息编解码器
 * JSON Array 格式: [MessageTypeId, UniqueId, Action/Payload...]
 */
@Slf4j
@Component
public class OcppFrameCodec {

    private final ObjectMapper mapper;

    public OcppFrameCodec(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public OcppFrame decode(String json) {
        try {
            ArrayNode array = (ArrayNode) mapper.readTree(json);
            int typeId = array.get(0).asInt();
            String messageId = array.get(1).asText();

            return switch (typeId) {
                case 2 -> OcppFrame.call(messageId, array.get(2).asText(), array.get(3));
                case 3 -> OcppFrame.callResult(messageId, array.get(2));
                case 4 -> OcppFrame.callError(messageId,
                        array.get(2).asText(), array.get(3).asText(),
                        array.size() > 4 ? array.get(4) : mapper.createObjectNode());
                default -> throw new IllegalArgumentException("Unknown OCPP frame type: " + typeId);
            };
        } catch (Exception e) {
            log.error("Failed to decode OCPP frame: {}", json, e);
            throw new RuntimeException("Invalid OCPP frame", e);
        }
    }

    public String encode(OcppFrame frame) {
        try {
            ArrayNode array = mapper.createArrayNode();
            array.add(switch (frame.type()) {
                case CALL -> 2;
                case CALL_RESULT -> 3;
                case CALL_ERROR -> 4;
            });
            array.add(frame.messageId());

            if (frame.type() == OcppFrame.FrameType.CALL) {
                array.add(frame.action());
                array.add(frame.payload());
            } else if (frame.type() == OcppFrame.FrameType.CALL_RESULT) {
                array.add(frame.payload() != null ? frame.payload() : mapper.createObjectNode());
            } else {
                array.add(frame.errorCode());
                array.add(frame.errorDescription() != null ? frame.errorDescription() : "");
                array.add(frame.payload() != null ? frame.payload() : mapper.createObjectNode());
            }

            return mapper.writeValueAsString(array);
        } catch (JsonProcessingException e) {
            log.error("Failed to encode OCPP frame", e);
            throw new RuntimeException("Cannot encode OCPP frame", e);
        }
    }
}
