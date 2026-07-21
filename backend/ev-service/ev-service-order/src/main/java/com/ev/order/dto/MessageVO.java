package com.ev.order.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class MessageVO {
    private String id;
    private String type;
    private String title;
    private String content;
    private Boolean isRead;
    private String relatedId;
    private LocalDateTime createTime;
    private LocalDateTime readTime;
}
