package com.ev.simulator.service;

import com.ev.simulator.dto.OcppMessageVO;
import java.util.List;

public interface OcppService {
    OcppMessageVO send(OcppMessageVO message);
    List<OcppMessageVO> history(String chargePointId, int limit);
}
