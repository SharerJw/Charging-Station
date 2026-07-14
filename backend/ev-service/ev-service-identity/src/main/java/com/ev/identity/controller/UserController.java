package com.ev.identity.controller;

import com.ev.common.core.result.R;
import com.ev.identity.dto.SmsLoginReq;
import com.ev.identity.dto.LoginResp;
import com.ev.identity.dto.UserVO;
import com.ev.identity.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@Tag(name = "用户端-认证")
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class UserController {

    private final AuthService authService;

    @Operation(summary = "发送验证码")
    @PostMapping("/auth/sms-code")
    public R<Void> sendSmsCode(@RequestBody java.util.Map<String, String> body) {
        authService.sendSmsCode(body.get("phone"));
        return R.ok();
    }

    @Operation(summary = "用户端登录(手机号+验证码)")
    @PostMapping("/auth/login")
    public R<LoginResp> smsLogin(@Valid @RequestBody SmsLoginReq req) {
        return R.ok(authService.smsLogin(req));
    }

    @Operation(summary = "获取用户信息")
    @GetMapping("/user/profile")
    public R<UserVO> profile(@RequestHeader(value = "X-User-Id", required = false) Long userId) {
        if (userId == null) userId = 3L;
        return R.ok(authService.getUserInfo(userId));
    }
}
