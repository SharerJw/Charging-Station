package com.ev.common.security.interceptor;

import com.ev.common.core.constant.CommonConstants;
import com.ev.common.core.util.TenantContext;
import com.ev.common.security.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * JWT 认证拦截器
 * 从 Authorization header 解析 JWT，注入用户上下文
 */
@Slf4j
public class AuthInterceptor implements HandlerInterceptor {

    /** 白名单路径前缀 */
    private static final String[] WHITE_LIST = {
            "/api/auth/login",
            "/api/v1/auth/login",
            "/api/v1/auth/sms-code",
            "/api/v1/ops/auth/login",
            "/api/v1/stations",
            "/api/simulator/",
            "/actuator/",
            "/doc.html",
            "/v3/api-docs",
            "/swagger-resources",
            "/webjars/"
    };

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String uri = request.getRequestURI();

        // 白名单直接放行
        for (String prefix : WHITE_LIST) {
            if (uri.startsWith(prefix)) {
                return true;
            }
        }

        // 提取 Authorization header
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            response.setStatus(401);
            return false;
        }

        String token = authHeader.substring(7);

        // 验证 JWT
        if (!JwtUtil.validate(token)) {
            response.setStatus(401);
            return false;
        }

        // 注入用户上下文
        Long userId = JwtUtil.getUserId(token);
        String username = JwtUtil.getUsername(token);
        String tenantId = JwtUtil.getTenantId(token);

        TenantContext.setUserId(userId);
        TenantContext.setUsername(username);
        TenantContext.setTenantId(tenantId != null ? tenantId : CommonConstants.DEFAULT_TENANT_ID);

        // 注入请求头供下游使用
        request.setAttribute(CommonConstants.HEADER_USER_ID, userId);
        request.setAttribute(CommonConstants.HEADER_USERNAME, username);
        request.setAttribute(CommonConstants.HEADER_TENANT_ID, tenantId);

        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                                Object handler, Exception ex) {
        TenantContext.clear();
    }
}
