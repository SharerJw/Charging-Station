package com.ev.identity.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Spring Security 配置 —— 身份认证服务专用
 * <p>
 * 规则：
 * <ul>
 *   <li>公开放行：登录、注册、短信验证码、Actuator、Swagger/Knife4j 文档</li>
 *   <li>其余路径均需认证</li>
 *   <li>CSRF 禁用（纯 API 服务）</li>
 *   <li>无状态会话管理（Stateless）</li>
 * </ul>
 */
@Configuration
@EnableWebSecurity
class IdentitySecurityConfig {

    // ======================== 公开路径 ========================

    private static final String[] PUBLIC_PATHS = {
            // 认证接口（管理端）
            "/api/auth/**",
            "/api/v1/auth/**",

            // 认证接口（运维端）
            "/api/v1/ops/auth/**",

            // 运维端用户信息（Gateway 注入 X-User-Id，无需登录 token）
            "/api/v1/ops/user/profile",

            // Actuator 健康检查
            "/actuator/**",

            // Knife4j / Swagger 文档
            "/doc.html",
            "/v3/api-docs/**",
            "/swagger-ui/**"
    };

    // ======================== SecurityFilterChain ========================

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // 禁用 CSRF（API 服务不需要）
                .csrf(AbstractHttpConfigurer::disable)

                // 无状态会话管理
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 路由授权规则
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(PUBLIC_PATHS).permitAll()
                        .anyRequest().authenticated()
                );

        return http.build();
    }

}
