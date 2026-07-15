package com.ev.common.core.util;

import java.util.regex.Pattern;

/**
 * 输入清理工具 - 防止 XSS 注入
 */
public final class SanitizeUtil {

    private SanitizeUtil() {}

    /** 匹配所有 HTML 标签（含自闭合） */
    private static final Pattern HTML_TAG = Pattern.compile("<[^>]+>");

    /** 匹配危险字符序列 */
    private static final Pattern DANGEROUS_CHARS = Pattern.compile("[\"'<>\\\\]");

    /**
     * 去除 HTML 标签，保留纯文本
     */
    public static String stripHtml(String input) {
        if (input == null || input.isEmpty()) {
            return input;
        }
        String stripped = HTML_TAG.matcher(input).replaceAll("");
        return stripped.trim();
    }

    /**
     * 清理文本字段（去除 HTML + 转义危险字符）
     */
    public static String sanitize(String input) {
        if (input == null || input.isEmpty()) {
            return input;
        }
        return stripHtml(input);
    }
}
