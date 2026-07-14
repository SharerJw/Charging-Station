package com.ev.common.security.config;

import com.ev.common.security.interceptor.AuthInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Sa-Token / 安全配置
 */
@Configuration
public class SecurityConfig implements WebMvcConfigurer {

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new AuthInterceptor())
                .addPathPatterns("/api/**", "/internal/**")
                .excludePathPatterns(
                        "/api/auth/login",
                        "/api/v1/auth/login",
                        "/api/v1/ops/auth/login",
                        "/api/simulator/**",
                        "/actuator/**",
                        "/doc.html",
                        "/v3/api-docs/**",
                        "/swagger-resources/**",
                        "/webjars/**"
                );
    }
}
