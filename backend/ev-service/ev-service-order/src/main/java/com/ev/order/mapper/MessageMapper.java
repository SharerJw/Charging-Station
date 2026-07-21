package com.ev.order.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ev.order.entity.MessageEntity;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface MessageMapper extends BaseMapper<MessageEntity> {
}
