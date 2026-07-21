package com.ev.order.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ev.common.core.dto.PageQuery;
import com.ev.common.core.exception.BizException;
import com.ev.common.core.result.PageResult;
import com.ev.order.dto.MessageVO;
import com.ev.order.entity.MessageEntity;
import com.ev.order.mapper.MessageMapper;
import com.ev.order.service.MessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {

    private final MessageMapper messageMapper;

    @Override
    public PageResult<MessageVO> page(PageQuery query, String type) {
        LambdaQueryWrapper<MessageEntity> wrapper = new LambdaQueryWrapper<>();
        if (type != null && !type.isBlank()) {
            wrapper.eq(MessageEntity::getType, type);
        }
        wrapper.orderByDesc(MessageEntity::getCreatedAt);

        Page<MessageEntity> page = messageMapper.selectPage(
                new Page<>(query.getPage(), query.getSize()), wrapper);
        List<MessageVO> voList = page.getRecords().stream()
                .map(this::toVO).collect(Collectors.toList());
        return PageResult.of(voList, page.getTotal(), query.getPage(), query.getSize());
    }

    @Override
    public Long unreadCount() {
        LambdaQueryWrapper<MessageEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(MessageEntity::getIsRead, false);
        return messageMapper.selectCount(wrapper);
    }

    @Override
    @Transactional
    public void markRead(Long id) {
        MessageEntity msg = messageMapper.selectById(id);
        if (msg == null) {
            throw BizException.of(4001, "消息不存在");
        }
        msg.setIsRead(true);
        msg.setReadTime(LocalDateTime.now());
        messageMapper.updateById(msg);
        log.info("消息已标记已读: messageId={}", id);
    }

    @Override
    @Transactional
    public void markAllRead(String type) {
        LambdaQueryWrapper<MessageEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(MessageEntity::getIsRead, false);
        if (type != null && !type.isBlank()) {
            wrapper.eq(MessageEntity::getType, type);
        }
        MessageEntity update = new MessageEntity();
        update.setIsRead(true);
        update.setReadTime(LocalDateTime.now());
        messageMapper.update(update, wrapper);
        log.info("批量标记消息已读: type={}", type);
    }

    private MessageVO toVO(MessageEntity e) {
        return MessageVO.builder()
                .id(String.valueOf(e.getId()))
                .type(e.getType())
                .title(e.getTitle())
                .content(e.getContent())
                .isRead(e.getIsRead())
                .relatedId(e.getRelatedId())
                .createTime(e.getCreatedAt())
                .readTime(e.getReadTime())
                .build();
    }
}
