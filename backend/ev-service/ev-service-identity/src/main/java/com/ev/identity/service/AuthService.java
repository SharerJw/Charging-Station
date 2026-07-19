package com.ev.identity.service;

import com.ev.identity.dto.LoginReq;
import com.ev.identity.dto.LoginResp;
import com.ev.identity.dto.SmsLoginReq;
import com.ev.identity.dto.UserStatsVO;
import com.ev.identity.dto.UserVO;
import org.springframework.web.multipart.MultipartFile;

public interface AuthService {
    LoginResp login(LoginReq req, String clientIp);
    LoginResp smsLogin(SmsLoginReq req);
    LoginResp opsLogin(LoginReq req, String clientIp);
    UserVO getUserInfo(Long userId);
    UserStatsVO getUserStats(Long userId);
    void sendSmsCode(String phone);
    void updateProfile(Long userId, String nickname, String avatar);
    String uploadAvatar(Long userId, MultipartFile file);
}
