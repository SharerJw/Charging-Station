package com.ev.simulator.service.impl;

import com.ev.simulator.dto.OcppMessageVO;
import com.ev.simulator.service.OcppService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentLinkedDeque;

@Slf4j
@Service
public class OcppServiceImpl implements OcppService {

    private final Deque<OcppMessageVO> messages = new ConcurrentLinkedDeque<>();

    @Override
    public OcppMessageVO send(OcppMessageVO message) {
        message.setMessageId(UUID.randomUUID().toString().substring(0, 8));
        message.setTimestamp(Instant.now().toString());
        message.setDirection("outbound");
        messages.addFirst(message);
        if (messages.size() > 500) messages.removeLast();
        log.info("OCPP消息发送: action={}, type={}, cp={}", message.getAction(), message.getType(), message.getChargePointId());
        return message;
    }

    @Override
    public List<OcppMessageVO> history(String chargePointId, int limit) {
        return messages.stream()
                .filter(m -> chargePointId == null || chargePointId.equals(m.getChargePointId()))
                .limit(limit > 0 ? limit : 50)
                .toList();
    }
}
