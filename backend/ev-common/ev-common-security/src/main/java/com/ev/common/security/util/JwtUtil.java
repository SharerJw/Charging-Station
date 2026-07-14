package com.ev.common.security.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * JWT 工具类 (HMAC-SHA256)
 */
@Slf4j
public class JwtUtil {

    private static final String SECRET = "ev-charging-platform-jwt-secret-key-2026";
    private static final long EXPIRE_MS = 7200_000L; // 2小时
    private static final long REFRESH_EXPIRE_MS = 604800_000L; // 7天

    private static SecretKey getKey() {
        return Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
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
                .expiration(new Date(System.currentTimeMillis() + EXPIRE_MS))
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
}
