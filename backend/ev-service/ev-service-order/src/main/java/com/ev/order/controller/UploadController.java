package com.ev.order.controller;

import com.ev.common.core.result.R;
import com.ev.common.minio.config.MinioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * 文件上传控制器
 */
@Slf4j
@Tag(name = "文件上传")
@RestController
@RequestMapping("/api/v1/upload")
@RequiredArgsConstructor
public class UploadController {

    private final MinioService minioService;

    @Operation(summary = "上传退款凭证")
    @PostMapping("/refund")
    public R<Map<String, String>> uploadRefund(@RequestParam("file") MultipartFile file) {
        String url = minioService.uploadFile(file, "refunds");
        return R.ok(Map.of("url", url));
    }

    @Operation(summary = "上传发票附件")
    @PostMapping("/invoice")
    public R<Map<String, String>> uploadInvoice(@RequestParam("file") MultipartFile file) {
        String url = minioService.uploadFile(file, "invoices");
        return R.ok(Map.of("url", url));
    }

    @Operation(summary = "上传通用文件")
    @PostMapping("/{directory}")
    public R<Map<String, String>> uploadFile(
            @PathVariable String directory,
            @RequestParam("file") MultipartFile file) {
        String url = minioService.uploadFile(file, directory);
        return R.ok(Map.of("url", url));
    }
}
