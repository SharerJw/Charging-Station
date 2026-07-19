package com.ev.identity.controller;

import com.ev.common.core.result.R;
import com.ev.identity.dto.SmsLoginReq;
import com.ev.identity.dto.LoginResp;
import com.ev.identity.dto.UserStatsVO;
import com.ev.identity.dto.UserVO;
import com.ev.identity.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Tag(name = "用户端-认证")
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class UserController {

    private final AuthService authService;

    @Operation(summary = "发送验证码")
    @PostMapping("/auth/sms-code")
    public R<Void> sendSmsCode(@RequestBody Map<String, String> body) {
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
    public R<UserVO> profile(@RequestAttribute(value = "X-User-Id", required = false) Long userId) {
        if (userId == null) userId = 3L;
        return R.ok(authService.getUserInfo(userId));
    }

    @Operation(summary = "修改用户资料")
    @PutMapping("/user/profile")
    public R<Void> updateProfile(
            @RequestAttribute(value = "X-User-Id", required = false) Long userId,
            @RequestBody Map<String, String> body) {
        if (userId == null) userId = 3L;
        authService.updateProfile(userId, body.get("nickname"), body.get("avatar"));
        return R.ok();
    }

    @Operation(summary = "上传头像")
    @PostMapping("/user/avatar")
    public R<Map<String, String>> uploadAvatar(
            @RequestAttribute(value = "X-User-Id", required = false) Long userId,
            @RequestParam("file") MultipartFile file) {
        if (userId == null) userId = 3L;
        String url = authService.uploadAvatar(userId, file);
        return R.ok(Map.of("url", url));
    }

    @Operation(summary = "获取用户充电统计")
    @GetMapping("/user/stats")
    public R<UserStatsVO> userStats(@RequestAttribute(value = "X-User-Id", required = false) Long userId) {
        if (userId == null) userId = 3L;
        return R.ok(authService.getUserStats(userId));
    }
}
