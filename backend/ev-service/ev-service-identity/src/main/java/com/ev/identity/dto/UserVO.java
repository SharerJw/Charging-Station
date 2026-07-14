package com.ev.identity.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class UserVO {
    private String id;
    private String username;
    private String nickname;
    private String phone;
    private String avatar;
    private List<String> roles;
    private List<String> permissions;
    private String tenantId;
    private String tenantName;
    private String orgId;
    private String orgName;
    private Long balance;       // 余额(分)
    private Integer couponCount;
    private Integer pointBalance;
    private String memberLevel;
    private Long totalConsumption;
}
