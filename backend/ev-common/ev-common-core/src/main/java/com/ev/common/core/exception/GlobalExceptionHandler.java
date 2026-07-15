package com.ev.common.core.exception;

import com.ev.common.core.result.R;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.stream.Collectors;

/**
 * 全局异常处理器
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * 业务异常
     */
    @ExceptionHandler(BizException.class)
    @ResponseStatus(HttpStatus.OK)
    public R<Void> handleBiz(BizException e) {
        log.warn("业务异常: code={}, msg={}", e.getCode(), e.getMessage());
        return R.fail(e.getCode(), e.getMessage());
    }

    /**
     * 参数校验异常 (@Valid @RequestBody)
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.OK)
    public R<Void> handleValidation(MethodArgumentNotValidException e) {
        String msg = e.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .collect(Collectors.joining("; "));
        log.warn("参数校验失败: {}", msg);
        return R.fail(1001, msg);
    }

    /**
     * 参数绑定异常 (Query参数)
     */
    @ExceptionHandler(BindException.class)
    @ResponseStatus(HttpStatus.OK)
    public R<Void> handleBind(BindException e) {
        String msg = e.getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining("; "));
        log.warn("参数绑定失败: {}", msg);
        return R.fail(1001, msg);
    }

    /**
     * 约束违反异常
     */
    @ExceptionHandler(ConstraintViolationException.class)
    @ResponseStatus(HttpStatus.OK)
    public R<Void> handleConstraint(ConstraintViolationException e) {
        String msg = e.getConstraintViolations().stream()
                .map(ConstraintViolation::getMessage)
                .collect(Collectors.joining("; "));
        log.warn("约束违反: {}", msg);
        return R.fail(1001, msg);
    }

    /**
     * Sa-Token 未登录异常 (占位，实际由 sa-token 框架处理)
     */
    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.OK)
    public R<Void> handleIllegalArgument(IllegalArgumentException e) {
        log.warn("非法参数: {}", e.getMessage());
        return R.fail(1001, e.getMessage());
    }

    /**
     * A-003 fix: 路径参数类型不匹配（如注入攻击字符串传入 Long 参数）
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    @ResponseStatus(HttpStatus.OK)
    public R<Void> handleTypeMismatch(MethodArgumentTypeMismatchException e) {
        String name = e.getName();
        String value = e.getValue() != null ? e.getValue().toString() : "null";
        log.warn("参数类型错误: name={}, value={}", name, value);
        return R.fail(1001, "参数格式不正确: " + name);
    }

    /**
     * P-001 fix: HTTP 方法不支持 → 405
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    @ResponseStatus(HttpStatus.METHOD_NOT_ALLOWED)
    public R<Void> handleMethodNotAllowed(HttpRequestMethodNotSupportedException e) {
        log.warn("HTTP方法不支持: {}", e.getMethod());
        return R.fail(1003, "请求方法不支持: " + e.getMethod());
    }

    /**
     * D-005/CT-001 fix: Content-Type不支持 → 415
     */
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    @ResponseStatus(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
    public R<Void> handleMediaTypeNotSupported(HttpMediaTypeNotSupportedException e) {
        log.warn("Content-Type不支持: {}", e.getContentType());
        return R.fail(1006, "不支持的请求格式: " + (e.getContentType() != null ? e.getContentType() : "未指定"));
    }

    /**
     * D-006 fix: 请求体不可读（畸形JSON等）→ 400
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public R<Void> handleNotReadable(HttpMessageNotReadableException e) {
        log.warn("请求体解析失败: {}", e.getMessage());
        return R.fail(1001, "请求格式不正确");
    }

    /**
     * NumberFormatException 兜底（手动 Long.parseLong 时触发）
     */
    @ExceptionHandler(NumberFormatException.class)
    @ResponseStatus(HttpStatus.OK)
    public R<Void> handleNumberFormat(NumberFormatException e) {
        log.warn("数字格式异常: {}", e.getMessage());
        return R.fail(1001, "ID 格式不正确，必须为纯数字");
    }

    /**
     * 未知异常
     */
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public R<Void> handleUnknown(Exception e, HttpServletRequest request) {
        String traceId = MDC.get("traceId");
        log.error("未知异常 traceId={} uri={}", traceId, request.getRequestURI(), e);
        return R.fail(9999, "系统繁忙，请稍后重试");
    }
}
