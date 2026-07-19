package com.ev.identity.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ev.common.core.exception.BizException;
import com.ev.common.minio.config.MinioService;
import com.ev.common.redis.util.RedisLock;
import com.ev.common.security.util.JwtUtil;
import com.ev.identity.dto.*;
import com.ev.identity.entity.SysUser;
import com.ev.identity.mapper.SysUserMapper;
import com.ev.identity.service.AuthService;
import com.ev.identity.service.LoginRateLimiter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final SysUserMapper userMapper;
    private final RedisLock redisLock;
    private final LoginRateLimiter loginRateLimiter;
    private final MinioService minioService;
    private final PasswordEncoder passwordEncoder;

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

        // 密码验证：支持 BCrypt 和旧密码兼容
        if (user.getPassword() != null && !user.getPassword().isEmpty()) {
            if (passwordEncoder.matches(req.getPassword(), user.getPassword())) {
                // BCrypt 验证通过
            } else {
                // 兼容旧密码：检查是否是演示密码
                if (isLegacyDemoPassword(req.getPassword(), req.getUsername())) {
                    // 自动升级密码为 BCrypt
                    user.setPassword(passwordEncoder.encode(req.getPassword()));
                    userMapper.updateById(user);
                    log.info("用户 {} 密码已自动升级为 BCrypt", req.getUsername());
                } else {
                    loginRateLimiter.recordFailure(req.getUsername(), clientIp);
                    throw BizException.wrongPassword();
                }
            }
        } else {
            // 用户没有设置密码（如手机号注册用户）
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

        // 密码验证：支持 BCrypt 和旧密码兼容
        if (user.getPassword() != null && !user.getPassword().isEmpty()) {
            if (passwordEncoder.matches(req.getPassword(), user.getPassword())) {
                // BCrypt 验证通过
            } else {
                // 兼容旧密码：检查是否是演示密码
                if (isLegacyDemoPassword(req.getPassword(), req.getUsername())) {
                    // 自动升级密码为 BCrypt
                    user.setPassword(passwordEncoder.encode(req.getPassword()));
                    userMapper.updateById(user);
                    log.info("用户 {} 密码已自动升级为 BCrypt", req.getUsername());
                } else {
                    loginRateLimiter.recordFailure(req.getUsername(), clientIp);
                    throw BizException.wrongPassword();
                }
            }
        } else {
            // 用户没有设置密码
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
            // 使用 MinIO 上传文件
            String avatarUrl = minioService.uploadFile(file, "avatars");

            // 同步更新用户表
            SysUser user = userMapper.selectById(userId);
            if (user != null) {
                user.setAvatar(avatarUrl);
                userMapper.updateById(user);
            }

            log.info("头像已上传: userId={}, url={}", userId, avatarUrl);
            return avatarUrl;
        } catch (Exception e) {
            log.error("头像上传失败: userId={}", userId, e);
            throw new RuntimeException("头像上传失败: " + e.getMessage());
        }
    }

    private LoginResp buildLoginResp(SysUser user) {
        List<String> roles = userMapper.selectRoleCodesByUserId(user.getId());
        List<String> permissions = userMapper.selectPermissionCodesByUserId(user.getId());
        String rolesStr = String.join(",", roles);
        String permissionsStr = String.join(",", permissions);
        String token = JwtUtil.generateToken(user.getId(), user.getUsername(), rolesStr, permissionsStr, "T001", "ORG001");
        UserVO userVO = UserVO.builder()
                .id(String.valueOf(user.getId()))
                .username(user.getUsername())
                .nickname(user.getNickname())
                .phone(user.getPhone() != null ? user.getPhone() : "")
                .avatar(user.getAvatar())
                .roles(roles)
                .permissions(permissions)
                .balance(15000L)
                .couponCount(3)
                .build();
        return LoginResp.builder().token(token).user(userVO).build();
    }

    /**
     * 检查是否是旧的演示密码（兼容过渡期）
     * 仅用于演示环境，生产环境应移除此方法
     */
    private boolean isLegacyDemoPassword(String password, String username) {
        if (password == null) return false;
        // 演示环境的硬编码密码
        return ("admin123".equals(password) && "admin".equals(username))
                || ("ops123".equals(password) && "ops1".equals(username));
    }
}
