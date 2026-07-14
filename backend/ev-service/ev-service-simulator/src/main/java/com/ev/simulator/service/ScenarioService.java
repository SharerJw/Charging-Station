package com.ev.simulator.service;

import com.ev.simulator.dto.ScenarioVO;
import java.util.List;

public interface ScenarioService {
    List<ScenarioVO> list();
    ScenarioVO create(ScenarioVO scenario);
    void execute(String id);
    void stop(String id);
}
