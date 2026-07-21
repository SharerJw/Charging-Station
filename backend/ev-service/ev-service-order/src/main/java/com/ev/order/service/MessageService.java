package com.ev.order.service;

import com.ev.common.core.dto.PageQuery;
import com.ev.common.core.result.PageResult;
import com.ev.order.dto.MessageVO;

public interface MessageService {

    /**
     * 分页查询消息列表
     */
    PageResult<MessageVO> page(PageQuery query, String type);

    /**
     * 未读消息数量
     */
    Long unreadCount();

    /**
     * 标记单条已读
     */
    void markRead(Long id);

    /**
     * 标记全部已读
     */
    void markAllRead(String type);
}
