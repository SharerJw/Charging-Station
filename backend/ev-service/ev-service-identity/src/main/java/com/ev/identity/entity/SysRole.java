package com.ev.identity.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("sys_role")
public class SysRole {
    private Long id;
    private String code;
    private String name;
}
