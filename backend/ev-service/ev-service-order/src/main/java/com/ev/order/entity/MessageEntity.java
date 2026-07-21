package com.ev.order.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@TableName("ops_message")
public class MessageEntity implements Serializable {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String type;
    private String title;
    private String content;
    private String targetType;
    private String targetId;
    private Boolean isRead;
    private String relatedId;
    private String tenantId;
    private LocalDateTime createdAt;
    private LocalDateTime readTime;
}
