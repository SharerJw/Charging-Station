package com.ev.common.core.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 数据权限范围枚举
 */
@Getter
@AllArgsConstructor
public enum DataScope {

    ALL(1, "全部数据"),
    ORG_AND_CHILD(2, "本机构及下级"),
    ORG_ONLY(3, "仅本机构"),
    SELF_ONLY(4, "仅本人");

    private final int code;
    private final String description;

    /**
     * 根据 code 获取枚举
     */
    public static DataScope fromCode(int code) {
        for (DataScope scope : values()) {
            if (scope.code == code) {
                return scope;
            }
        }
        throw new IllegalArgumentException("未知的数据权限范围: " + code);
    }

    /**
     * 根据名称获取枚举
     */
    public static DataScope fromName(String name) {
        for (DataScope scope : values()) {
            if (scope.name().equalsIgnoreCase(name)) {
                return scope;
            }
        }
        throw new IllegalArgumentException("未知的数据权限范围: " + name);
    }
}
