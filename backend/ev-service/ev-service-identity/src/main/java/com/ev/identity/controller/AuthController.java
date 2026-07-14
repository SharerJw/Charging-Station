package com.ev.identity.controller;

import com.ev.common.core.result.R;
import com.ev.identity.dto.*;
import com.ev.identity.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@Tag(name = "认证管理")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "登录")
    @PostMapping("/login")
    public R<LoginResp> login(@Valid @RequestBody LoginReq req) {
        return R.ok(authService.login(req));
    }

    @Operation(summary = "登出")
    @PostMapping("/logout")
    public R<Void> logout() {
        // L1 简化：前端清token即可
        return R.ok();
    }

    @Operation(summary = "获取用户信息")
    @GetMapping("/profile")
    public R<UserVO> profile(@RequestHeader(value = "X-User-Id", required = false) Long userId) {
        if (userId == null) userId = 1L; // L1 默认
        return R.ok(authService.getUserInfo(userId));
    }

    @Operation(summary = "刷新Token")
    @PostMapping("/refresh")
    public R<String> refresh(@RequestHeader(value = "X-User-Id", required = false) Long userId) {
        if (userId == null) userId = 1L;
        UserVO user = authService.getUserInfo(userId);
        String token = com.ev.common.security.util.JwtUtil.generateToken(
                userId, user.getUsername(), String.join(",", user.getRoles()), "T001", "ORG001");
        return R.ok(token);
    }
}
