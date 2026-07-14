package com.ev.station.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.io.Serializable;

@Data @TableName("connector")
public class ConnectorEntity implements Serializable {
    @TableId(type = IdType.AUTO) private Long id;
    private Long deviceId; private Integer connectorId; private String type;
    private String status; private Integer maxPower;
    private Long cumulativeEnergy; private Integer chargeCount; private Long currentTransactionId;
}
