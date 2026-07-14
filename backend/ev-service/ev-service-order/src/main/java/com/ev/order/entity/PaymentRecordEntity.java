package com.ev.order.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.io.Serializable;
import java.time.LocalDateTime;

@Data @TableName("payment_record")
public class PaymentRecordEntity implements Serializable {
    @TableId(type = IdType.AUTO) private Long id;
    private String paymentNo; private Long orderId; private Long userId;
    private String channel; private Long amount; private String status;
    private String channelTradeNo; private LocalDateTime createdAt;
}
