package com.ev.identity.controller;

import com.ev.common.core.result.R;
import com.ev.identity.dto.LoginReq;
import com.ev.identity.dto.LoginResp;
import com.ev.identity.dto.UserVO;
import com.ev.identity.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

@Tag(name = "运维端-认证")
@RestController
@RequestMapping("/api/v1/ops")
@RequiredArgsConstructor
public class OpsAuthController {

    private static final String X_FORWARDED_FOR = "X-Forwarded-For";
    private static final String UNKNOWN_IP = "unknown";

    private final AuthService authService;

    @Operation(summary = "运维登录")
    @PostMapping("/auth/login")
    public R<LoginResp> opsLogin(@Valid @RequestBody LoginReq req, HttpServletRequest request) {
        return R.ok(authService.opsLogin(req, extractClientIp(request)));
    }

    @Operation(summary = "获取运维用户信息")
    @GetMapping("/user/profile")
    public R<UserVO> profile(@RequestHeader(value = "X-User-Id", required = false) Long userId) {
        if (userId == null) userId = 2L;
        return R.ok(authService.getUserInfo(userId));
    }

    private String extractClientIp(HttpServletRequest request) {
        String xff = request.getHeader(X_FORWARDED_FOR);
        if (StringUtils.hasText(xff) && !UNKNOWN_IP.equalsIgnoreCase(xff)) {
            return xff.split(",")[0].trim();
        }
        String remoteAddr = request.getRemoteAddr();
        return StringUtils.hasText(remoteAddr) ? remoteAddr : "0.0.0.0";
    }
}
