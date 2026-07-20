package com.ev.station.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.ev.common.mybatis.entity.BaseEntity;
import lombok.Data;

@Data @TableName("connector")
public class ConnectorEntity extends BaseEntity {
    private Long deviceId; private Integer connectorId; private String type;
    private String status; private Integer maxPower;
    private Long cumulativeEnergy; private Integer chargeCount; private Long currentTransactionId;
}
