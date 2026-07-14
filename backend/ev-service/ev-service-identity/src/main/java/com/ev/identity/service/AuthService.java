package com.ev.identity.service;

import com.ev.identity.dto.LoginReq;
import com.ev.identity.dto.LoginResp;
import com.ev.identity.dto.SmsLoginReq;
import com.ev.identity.dto.UserVO;

public interface AuthService {
    LoginResp login(LoginReq req);
    LoginResp smsLogin(SmsLoginReq req);
    LoginResp opsLogin(LoginReq req);
    UserVO getUserInfo(Long userId);
    void sendSmsCode(String phone);
}
