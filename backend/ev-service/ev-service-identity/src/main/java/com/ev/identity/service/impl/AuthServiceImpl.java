package com.ev.identity.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ev.common.core.exception.BizException;
import com.ev.common.redis.util.RedisLock;
import com.ev.common.security.util.JwtUtil;
import com.ev.identity.dto.*;
import com.ev.identity.entity.SysUser;
import com.ev.identity.mapper.SysUserMapper;
import com.ev.identity.service.AuthService;
import com.ev.identity.service.LoginRateLimiter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final SysUserMapper userMapper;
    private final RedisLock redisLock;
    private final LoginRateLimiter loginRateLimiter;

    private static final String SMS_CODE_PREFIX = "sms:code:";

    @Override
    public LoginResp login(LoginReq req, String clientIp) {
        // Check rate limit before attempting authentication
        loginRateLimiter.checkRateLimit(req.getUsername(), clientIp);

        SysUser user = userMapper.selectOne(
                new LambdaQueryWrapper<SysUser>().eq(SysUser::getUsername, req.getUsername()));
        if (user == null) {
            loginRateLimiter.recordFailure(req.getUsername(), clientIp);
            throw BizException.userNotFound();
        }
        if (user.getStatus() != 1) {
            loginRateLimiter.recordFailure(req.getUsername(), clientIp);
            throw BizException.accountDisabled();
        }
        // L1 简化：明文密码比较（生产环境用BCrypt）
        if (!req.getPassword().equals("admin123") && !req.getPassword().equals("ops123")) {
            loginRateLimiter.recordFailure(req.getUsername(), clientIp);
            throw BizException.wrongPassword();
        }

        // Successful login: reset failure counters
        loginRateLimiter.resetCounters(req.getUsername(), clientIp);
        return buildLoginResp(user);
    }

    @Override
    public LoginResp smsLogin(SmsLoginReq req) {
        // 校验验证码
        String cachedCode = redisLock.get(SMS_CODE_PREFIX + req.getPhone());
        if (cachedCode == null || !cachedCode.equals(req.getCode())) {
            throw BizException.invalidSmsCode();
        }
        redisLock.delete(SMS_CODE_PREFIX + req.getPhone());

        // 查找或创建用户
        SysUser user = userMapper.selectOne(
                new LambdaQueryWrapper<SysUser>().eq(SysUser::getPhone, req.getPhone()));
        if (user == null) {
            user = new SysUser();
            user.setUsername(req.getPhone());
            user.setPhone(req.getPhone());
            user.setNickname("充电用户");
            user.setStatus(1);
            userMapper.insert(user);
        }
        return buildLoginResp(user);
    }

    @Override
    public LoginResp opsLogin(LoginReq req, String clientIp) {
        // Check rate limit before attempting authentication
        loginRateLimiter.checkRateLimit(req.getUsername(), clientIp);

        SysUser user = userMapper.selectOne(
                new LambdaQueryWrapper<SysUser>().eq(SysUser::getUsername, req.getUsername()));
        if (user == null) {
            loginRateLimiter.recordFailure(req.getUsername(), clientIp);
            throw BizException.userNotFound();
        }
        // 校验角色
        List<String> roles = userMapper.selectRoleCodesByUserId(user.getId());
        if (!roles.contains("ops")) {
            loginRateLimiter.recordFailure(req.getUsername(), clientIp);
            throw BizException.noPermission();
        }
        if (!req.getPassword().equals("ops123")) {
            loginRateLimiter.recordFailure(req.getUsername(), clientIp);
            throw BizException.wrongPassword();
        }

        // Successful login: reset failure counters
        loginRateLimiter.resetCounters(req.getUsername(), clientIp);
        return buildLoginResp(user);
    }

    @Override
    public UserVO getUserInfo(Long userId) {
        SysUser user = userMapper.selectById(userId);
        if (user == null) {
            throw BizException.userNotFound();
        }
        List<String> roles = userMapper.selectRoleCodesByUserId(userId);
        List<String> permissions = userMapper.selectPermissionCodesByUserId(userId);
        return UserVO.builder()
                .id(String.valueOf(user.getId()))
                .username(user.getUsername())
                .nickname(user.getNickname())
                .phone(user.getPhone() != null ? user.getPhone() : "")
                .avatar(user.getAvatar())
                .roles(roles)
                .permissions(permissions)
                .tenantId("T001")
                .tenantName("EV充电集团")
                .orgId("ORG001")
                .orgName("总部")
                .balance(15000L)
                .couponCount(3)
                .pointBalance(2580)
                .memberLevel("GOLD")
                .totalConsumption(156800L)
                .build();
    }

    @Override
    public UserStatsVO getUserStats(Long userId) {
        // L1 阶段返回模拟数据；后续对接 order-service 获取真实统计
        return UserStatsVO.builder()
                .chargeCount(12)
                .totalEnergy(386.5)
                .totalSaved(58.3)
                .carbonReduction(245.8)
                .build();
    }

    @Override
    public void sendSmsCode(String phone) {
        String code = "123456"; // L1 固定验证码
        redisLock.set(SMS_CODE_PREFIX + phone, code, 5, TimeUnit.MINUTES);
        log.info("发送验证码: phone={}, code={}", phone, code);
    }

    @Override
    public void updateProfile(Long userId, String nickname, String avatar) {
        SysUser user = userMapper.selectById(userId);
        if (user == null) {
            throw BizException.userNotFound();
        }
        if (StringUtils.hasText(nickname)) {
            user.setNickname(nickname);
        }
        if (StringUtils.hasText(avatar)) {
            user.setAvatar(avatar);
        }
        userMapper.updateById(user);
        log.info("用户资料已更新: userId={}, nickname={}, avatar={}", userId, nickname, avatar);
    }

    @Override
    public String uploadAvatar(Long userId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("文件不能为空");
        }
        try {
            // L1 阶段：保存到本地 uploads 目录，返回可访问 URL
            String originalFilename = file.getOriginalFilename();
            String ext = originalFilename != null && originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : ".png";
            String filename = UUID.randomUUID().toString().replace("-", "") + ext;

            Path uploadDir = Paths.get("uploads", "avatars");
            Files.createDirectories(uploadDir);
            Path target = uploadDir.resolve(filename);
            file.transferTo(target.toFile());

            // 返回相对 URL，由网关或静态资源映射提供访问
            String avatarUrl = "/uploads/avatars/" + filename;

            // 同步更新用户表
            SysUser user = userMapper.selectById(userId);
            if (user != null) {
                user.setAvatar(avatarUrl);
                userMapper.updateById(user);
            }

            log.info("头像已上传: userId={}, url={}", userId, avatarUrl);
            return avatarUrl;
        } catch (IOException e) {
            log.error("头像上传失败: userId={}", userId, e);
            throw new RuntimeException("头像上传失败: " + e.getMessage());
        }
    }

    private LoginResp buildLoginResp(SysUser user) {
        List<String> roles = userMapper.selectRoleCodesByUserId(user.getId());
        String rolesStr = String.join(",", roles);
        String token = JwtUtil.generateToken(user.getId(), user.getUsername(), rolesStr, "T001", "ORG001");
        UserVO userVO = UserVO.builder()
                .id(String.valueOf(user.getId()))
                .username(user.getUsername())
                .nickname(user.getNickname())
                .phone(user.getPhone() != null ? user.getPhone() : "")
                .avatar(user.getAvatar())
                .roles(roles)
                .balance(15000L)
                .couponCount(3)
                .build();
        return LoginResp.builder().token(token).user(userVO).build();
    }
}
