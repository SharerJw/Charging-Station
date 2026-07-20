package com.ev.order.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Spring Security 配置 —— 订单服务
 * <p>
 * 规则：
 * <ul>
 *   <li>订单接口需要 USER 角色</li>
 *   <li>运维接口需要 OPS 或 ADMIN 角色</li>
 *   <li>仪表盘接口需要认证（不限角色）</li>
 *   <li>WebSocket / Actuator / Knife4j 文档公开放行</li>
 *   <li>CSRF 禁用（纯 API 服务）</li>
 *   <li>无状态会话管理（Stateless）</li>
 * </ul>
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    // ======================== 公开路径 ========================

    private static final String[] PUBLIC_PATHS = {
            // WebSocket
            "/ws/**",

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
                        // 公开放行
                        .requestMatchers(PUBLIC_PATHS).permitAll()

                        // 订单接口 —— 需要 USER 角色
                        .requestMatchers("/api/v1/orders/**").hasRole("USER")

                        // 运维接口 —— 需要 OPS 或 ADMIN 角色
                        .requestMatchers("/api/v1/ops/**").hasAnyRole("OPS", "ADMIN")

                        // 仪表盘接口 —— 需要认证（不限角色）
                        .requestMatchers("/api/dashboard/**").authenticated()

                        // 其余接口 —— 需要认证
                        .anyRequest().authenticated()
                );

        return http.build();
    }
}
