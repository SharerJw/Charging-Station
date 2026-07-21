package com.ev.order.controller;

import com.ev.common.core.dto.PageQuery;
import com.ev.common.core.result.PageResult;
import com.ev.common.core.result.R;
import com.ev.order.dto.MessageVO;
import com.ev.order.service.MessageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@Tag(name = "运维端-消息") @RestController @RequestMapping("/api/v1/ops/messages") @RequiredArgsConstructor
public class MessageController {
    private final MessageService messageService;

    @Operation(summary = "消息列表") @GetMapping
    public R<PageResult<MessageVO>> list(@RequestParam(required = false) String type,
                                          @RequestParam(defaultValue = "1") int page,
                                          @RequestParam(defaultValue = "10") int size) {
        PageQuery query = new PageQuery();
        query.setPage(page);
        query.setSize(size);
        return R.ok(messageService.page(query, type));
    }

    @Operation(summary = "未读消息数量") @GetMapping("/unread-count")
    public R<Long> unreadCount() {
        return R.ok(messageService.unreadCount());
    }

    @Operation(summary = "标记已读") @PostMapping("/{id}/read")
    public R<Void> markRead(@PathVariable Long id) {
        messageService.markRead(id);
        return R.ok();
    }

    @Operation(summary = "全部标记已读") @PostMapping("/read-all")
    public R<Void> markAllRead(@RequestParam(required = false) String type) {
        messageService.markAllRead(type);
        return R.ok();
    }
}
