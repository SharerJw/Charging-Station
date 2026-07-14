package com.ev.identity.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ev.common.core.exception.BizException;
import com.ev.common.redis.util.RedisLock;
import com.ev.common.security.util.JwtUtil;
import com.ev.identity.dto.*;
import com.ev.identity.entity.SysUser;
import com.ev.identity.mapper.SysUserMapper;
import com.ev.identity.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final SysUserMapper userMapper;
    private final RedisLock redisLock;

    private static final String SMS_CODE_PREFIX = "sms:code:";

    @Override
    public LoginResp login(LoginReq req) {
        SysUser user = userMapper.selectOne(
                new LambdaQueryWrapper<SysUser>().eq(SysUser::getUsername, req.getUsername()));
        if (user == null) {
            throw BizException.userNotFound();
        }
        if (user.getStatus() != 1) {
            throw BizException.accountDisabled();
        }
        // L1 简化：明文密码比较（生产环境用BCrypt）
        if (!req.getPassword().equals("admin123") && !req.getPassword().equals("ops123")) {
            throw BizException.wrongPassword();
        }
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
    public LoginResp opsLogin(LoginReq req) {
        SysUser user = userMapper.selectOne(
                new LambdaQueryWrapper<SysUser>().eq(SysUser::getUsername, req.getUsername()));
        if (user == null) {
            throw BizException.userNotFound();
        }
        // 校验角色
        List<String> roles = userMapper.selectRoleCodesByUserId(user.getId());
        if (!roles.contains("ops")) {
            throw BizException.noPermission();
        }
        if (!req.getPassword().equals("ops123")) {
            throw BizException.wrongPassword();
        }
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
                .phone(user.getPhone() != null ? user.getPhone().replaceAll("(\\d{3})\\d{4}(\\d{4})", "$1****$2") : "")
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
    public void sendSmsCode(String phone) {
        String code = "123456"; // L1 固定验证码
        redisLock.set(SMS_CODE_PREFIX + phone, code, 5, TimeUnit.MINUTES);
        log.info("发送验证码: phone={}, code={}", phone, code);
    }

    private LoginResp buildLoginResp(SysUser user) {
        List<String> roles = userMapper.selectRoleCodesByUserId(user.getId());
        String rolesStr = String.join(",", roles);
        String token = JwtUtil.generateToken(user.getId(), user.getUsername(), rolesStr, "T001", "ORG001");
        UserVO userVO = UserVO.builder()
                .id(String.valueOf(user.getId()))
                .username(user.getUsername())
                .nickname(user.getNickname())
                .phone(user.getPhone() != null ? user.getPhone().replaceAll("(\\d{3})\\d{4}(\\d{4})", "$1****$2") : "")
                .avatar(user.getAvatar())
                .roles(roles)
                .balance(15000L)
                .couponCount(3)
                .build();
        return LoginResp.builder().token(token).user(userVO).build();
    }
}
