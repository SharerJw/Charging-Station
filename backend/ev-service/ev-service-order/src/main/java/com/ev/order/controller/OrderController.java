package com.ev.order.controller;

import com.ev.common.core.result.R;
import com.ev.common.core.result.PageResult;
import com.ev.order.dto.*;
import com.ev.order.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@Tag(name = "订单管理") @RestController @RequiredArgsConstructor
public class OrderController {
    private final OrderService orderService;

    @Operation(summary = "订单列表") @GetMapping("/api/orders")
    public R<PageResult<OrderVO>> list(@Valid OrderQuery query) { return R.ok(orderService.page(query)); }

    @Operation(summary = "订单详情") @GetMapping("/api/orders/{id}")
    public R<OrderVO> detail(@PathVariable Long id) { return R.ok(orderService.detail(id)); }

    @Operation(summary = "退款") @PostMapping("/api/orders/{id}/refund")
    public R<Void> refund(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        orderService.refund(id, Long.valueOf(body.get("amount").toString()), (String) body.get("reason"));
        return R.ok();
    }

    @Operation(summary = "用户端订单列表") @GetMapping("/api/v1/orders")
    public R<PageResult<OrderVO>> userOrders(@RequestParam(defaultValue = "1") int page, @RequestParam(defaultValue = "20") int size,
                                              @RequestParam(required = false) String status) {
        OrderQuery query = new OrderQuery();
        query.setPage(page); query.setSize(size); query.setStatus(status);
        return R.ok(orderService.page(query));
    }

    @Operation(summary = "用户端订单详情") @GetMapping("/api/v1/orders/{id}")
    public R<OrderVO> userDetail(@PathVariable Long id) { return R.ok(orderService.detail(id)); }
}
