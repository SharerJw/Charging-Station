package com.ev.identity.controller;

import com.ev.common.core.result.R;
import com.ev.identity.dto.*;
import com.ev.identity.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

@Tag(name = "认证管理")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final String X_FORWARDED_FOR = "X-Forwarded-For";
    private static final String UNKNOWN_IP = "unknown";

    private final AuthService authService;

    @Operation(summary = "登录")
    @PostMapping("/login")
    public R<LoginResp> login(@Valid @RequestBody LoginReq req, HttpServletRequest request) {
        return R.ok(authService.login(req, extractClientIp(request)));
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

    @Operation(summary = "运维登录")
    @PostMapping("/ops/login")
    public R<LoginResp> opsLogin(@Valid @RequestBody LoginReq req, HttpServletRequest request) {
        return R.ok(authService.opsLogin(req, extractClientIp(request)));
    }

    /**
     * Extract the real client IP from the request.
     * Checks X-Forwarded-For first (for requests behind reverse proxies),
     * then falls back to the remote address.
     */
    private String extractClientIp(HttpServletRequest request) {
        String xff = request.getHeader(X_FORWARDED_FOR);
        if (StringUtils.hasText(xff) && !UNKNOWN_IP.equalsIgnoreCase(xff)) {
            // X-Forwarded-For may contain multiple IPs: client, proxy1, proxy2
            // The first one is the original client
            return xff.split(",")[0].trim();
        }
        String remoteAddr = request.getRemoteAddr();
        return StringUtils.hasText(remoteAddr) ? remoteAddr : "0.0.0.0";
    }
}
