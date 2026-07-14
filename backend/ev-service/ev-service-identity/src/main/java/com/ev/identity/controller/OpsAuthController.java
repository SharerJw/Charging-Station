package com.ev.identity.controller;

import com.ev.common.core.result.R;
import com.ev.identity.dto.LoginReq;
import com.ev.identity.dto.LoginResp;
import com.ev.identity.dto.UserVO;
import com.ev.identity.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@Tag(name = "运维端-认证")
@RestController
@RequestMapping("/api/v1/ops")
@RequiredArgsConstructor
public class OpsAuthController {

    private final AuthService authService;

    @Operation(summary = "运维登录")
    @PostMapping("/auth/login")
    public R<LoginResp> opsLogin(@Valid @RequestBody LoginReq req) {
        return R.ok(authService.opsLogin(req));
    }

    @Operation(summary = "获取运维用户信息")
    @GetMapping("/user/profile")
    public R<UserVO> profile(@RequestHeader(value = "X-User-Id", required = false) Long userId) {
        if (userId == null) userId = 2L;
        return R.ok(authService.getUserInfo(userId));
    }
}
