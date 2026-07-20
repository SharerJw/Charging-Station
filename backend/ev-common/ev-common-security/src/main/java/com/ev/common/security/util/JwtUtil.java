package com.ev.common.security.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * JWT 工具类 (HMAC-SHA256)
 * <p>
 * Secret 和过期时间通过 Spring 配置注入，生产环境必须通过 jwt.secret 配置或 JWT_SECRET 环境变量提供。
 * Secret 长度不得少于 32 字符，否则应用启动时将抛出 IllegalStateException。
 */
@Component
@Slf4j
public class JwtUtil {

    private static String secret = "";
    private static long expireMs = 7200_000L;        // 2小时
    private static long refreshExpireMs = 604800_000L; // 7天

    @Value("${jwt.secret}")
    private String injectedSecret;

    @Value("${jwt.expire-ms:7200000}")
    private long injectedExpireMs;

    @Value("${jwt.refresh-expire-ms:604800000}")
    private long injectedRefreshExpireMs;

    @PostConstruct
    public void init() {
        if (injectedSecret == null || injectedSecret.isBlank()) {
            throw new IllegalStateException(
                    "jwt.secret 未配置！请通过配置文件或 JWT_SECRET 环境变量设置 JWT 签名密钥。");
        }
        if (injectedSecret.length() < 32) {
            throw new IllegalStateException(
                    "jwt.secret 长度不足 32 字符，当前长度为 " + injectedSecret.length() + "。请使用更长的密钥以确保安全性。");
        }
        secret = injectedSecret;
        expireMs = injectedExpireMs;
        refreshExpireMs = injectedRefreshExpireMs;
        log.info("JwtUtil 初始化完成, expireMs={}, refreshExpireMs={}", expireMs, refreshExpireMs);
    }

    private static SecretKey getKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * 生成 JWT Token
     */
    public static String generateToken(Long userId, String username, String roles, String tenantId, String orgId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("username", username);
        claims.put("roles", roles);
        claims.put("tenantId", tenantId);
        claims.put("orgId", orgId);

        return Jwts.builder()
                .claims(claims)
                .subject(String.valueOf(userId))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expireMs))
                .signWith(getKey())
                .compact();
    }

    /**
     * 生成 JWT Token（包含权限信息）
     */
    public static String generateToken(Long userId, String username, String roles, String permissions, String tenantId, String orgId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("username", username);
        claims.put("roles", roles);
        claims.put("permissions", permissions);
        claims.put("tenantId", tenantId);
        claims.put("orgId", orgId);

        return Jwts.builder()
                .claims(claims)
                .subject(String.valueOf(userId))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expireMs))
                .signWith(getKey())
                .compact();
    }

    /**
     * 解析 JWT Token
     */
    public static Claims parseToken(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(getKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (Exception e) {
            log.warn("JWT解析失败: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 验证 Token 是否有效
     */
    public static boolean validate(String token) {
        Claims claims = parseToken(token);
        return claims != null && claims.getExpiration().after(new Date());
    }

    /**
     * 从 Token 获取用户ID
     */
    public static Long getUserId(String token) {
        Claims claims = parseToken(token);
        if (claims == null) return null;
        Object userId = claims.get("userId");
        if (userId instanceof Number) return ((Number) userId).longValue();
        return Long.parseLong(userId.toString());
    }

    /**
     * 从 Token 获取用户名
     */
    public static String getUsername(String token) {
        Claims claims = parseToken(token);
        return claims != null ? (String) claims.get("username") : null;
    }

    /**
     * 从 Token 获取角色
     */
    public static String getRoles(String token) {
        Claims claims = parseToken(token);
        return claims != null ? (String) claims.get("roles") : null;
    }

    /**
     * 从 Token 获取租户ID
     */
    public static String getTenantId(String token) {
        Claims claims = parseToken(token);
        return claims != null ? (String) claims.get("tenantId") : null;
    }

    /**
     * 从 Token 获取组织ID
     */
    public static String getOrgId(String token) {
        Claims claims = parseToken(token);
        return claims != null ? (String) claims.get("orgId") : null;
    }

    /**
     * 从 Token 获取权限
     */
    public static String getPermissions(String token) {
        Claims claims = parseToken(token);
        return claims != null ? (String) claims.get("permissions") : null;
    }
}
