package com.ev.gateway.filter;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.reactive.error.ErrorWebExceptionHandler;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.resource.NoResourceFoundException;
import org.springframework.web.server.MethodNotAllowedException;
import org.springframework.web.server.NotAcceptableStatusException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.UnsupportedMediaTypeStatusException;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 全局异常处理器 — 将 500 错误转化为有意义的 4xx 响应
 *
 * 覆盖场景：
 * - 400 Bad Request          : 请求体格式错误（malformed JSON）、参数校验失败
 * - 405 Method Not Allowed   : 不支持的 HTTP 方法
 * - 404 Not Found            : 路由不存在（含路径穿越探测）
 * - 413 Payload Too Large    : 请求体超过大小限制
 * - 415 Unsupported Media Type : 不支持的 Content-Type
 * - 503 Service Unavailable  : 下游服务不可用
 * - 500 Internal Server Error : 其他未预期异常（仅记录摘要，不暴露堆栈）
 */
@Slf4j
@Component
public class GlobalErrorWebExceptionHandler implements ErrorWebExceptionHandler {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public Mono<Void> handle(ServerWebExchange exchange, Throwable ex) {
        ServerHttpResponse response = exchange.getResponse();

        // 响应已提交则无法修改
        if (response.isCommitted()) {
            return Mono.error(ex);
        }

        HttpStatus status = resolveStatus(ex);
        String message = resolveMessage(status, ex);

        // 生产环境只记录 WARN 以上，开发环境记录 DEBUG
        if (status.is5xxServerError()) {
            log.error("[Gateway Error] path={} status={} error={}",
                    exchange.getRequest().getURI().getPath(), status.value(), ex.getMessage(), ex);
        } else {
            log.debug("[Gateway Error] path={} status={} error={}",
                    exchange.getRequest().getURI().getPath(), status.value(), ex.getMessage());
        }

        return writeErrorResponse(response, status, message);
    }

    /**
     * 根据异常类型映射 HTTP 状态码
     */
    private HttpStatus resolveStatus(Throwable ex) {
        if (ex instanceof NoResourceFoundException) {
            return HttpStatus.NOT_FOUND;                          // 404
        }
        if (ex instanceof MethodNotAllowedException) {
            return HttpStatus.METHOD_NOT_ALLOWED;                 // 405
        }
        if (ex instanceof UnsupportedMediaTypeStatusException) {
            return HttpStatus.UNSUPPORTED_MEDIA_TYPE;             // 415
        }
        if (ex instanceof NotAcceptableStatusException) {
            return HttpStatus.NOT_ACCEPTABLE;                     // 406
        }
        if (ex instanceof ResponseStatusException rse) {
            return HttpStatus.valueOf(rse.getStatusCode().value());
        }
        if (ex instanceof JsonProcessingException) {
            return HttpStatus.BAD_REQUEST;                        // 400
        }
        // DataBufferLimitException 在 spring-core 6.x 中不存在独立类，
        // 当请求体超限时会抛出 ResponseStatusException(413) 或 TooLongHttpStreamException
        if (isPayloadTooLarge(ex)) {
            return HttpStatus.PAYLOAD_TOO_LARGE;                  // 413
        }
        return HttpStatus.INTERNAL_SERVER_ERROR;                  // 500
    }

    /**
     * 判断是否为请求体过大异常
     */
    private boolean isPayloadTooLarge(Throwable ex) {
        String name = ex.getClass().getSimpleName();
        String message = ex.getMessage() != null ? ex.getMessage().toLowerCase() : "";
        return name.contains("DataBufferLimit")
                || name.contains("TooLong")
                || message.contains("exceeds the maximum")
                || message.contains("part headers")
                || message.contains("request entity too large");
    }

    /**
     * 根据状态码返回用户可读消息（不暴露内部堆栈）
     */
    private String resolveMessage(HttpStatus status, Throwable ex) {
        return switch (status) {
            case BAD_REQUEST -> "请求格式错误，请检查请求体是否为合法 JSON";
            case NOT_FOUND -> "请求的资源不存在";
            case METHOD_NOT_ALLOWED -> "不支持的请求方法";
            case UNSUPPORTED_MEDIA_TYPE -> "不支持的 Content-Type，请使用 application/json";
            case NOT_ACCEPTABLE -> "请求的响应格式不被支持";
            case PAYLOAD_TOO_LARGE -> "请求体超过最大限制（1MB）";
            case SERVICE_UNAVAILABLE -> "服务暂时不可用，请稍后重试";
            default -> "服务器内部错误";
        };
    }

    /**
     * 写入 JSON 错误响应体
     */
    private Mono<Void> writeErrorResponse(ServerHttpResponse response, HttpStatus status, String message) {
        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        response.getHeaders().set(HttpHeaders.CACHE_CONTROL, "no-store");

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("code", status.value());
        body.put("message", message);
        body.put("data", null);

        byte[] bytes;
        try {
            bytes = objectMapper.writeValueAsBytes(body);
        } catch (JsonProcessingException e) {
            // JSON 序列化本身失败，回退到纯文本
            bytes = "{\"code\":500,\"message\":\"服务器内部错误\",\"data\":null}".getBytes(StandardCharsets.UTF_8);
        }

        DataBuffer buffer = new DefaultDataBufferFactory().wrap(bytes);
        return response.writeWith(Mono.just(buffer))
                .doOnError(error -> DataBufferUtils.release(buffer));
    }
}
