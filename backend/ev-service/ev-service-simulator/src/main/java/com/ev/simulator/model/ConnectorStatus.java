package com.ev.simulator.model;

/** OCPP 1.6 连接器状态枚举 */
public enum ConnectorStatus {
    Available, Preparing, Charging, SuspendedEVSE, SuspendedEV,
    Finishing, Reserved, Unavailable, Faulted
}
