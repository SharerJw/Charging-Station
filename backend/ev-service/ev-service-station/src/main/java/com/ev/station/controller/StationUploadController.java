package com.ev.station.controller;

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
 * 站点服务-文件上传控制器
 */
@Slf4j
@Tag(name = "站点服务-文件上传")
@RestController
@RequestMapping("/api/v1/stations/upload")
@RequiredArgsConstructor
public class StationUploadController {

    private final MinioService minioService;

    @Operation(summary = "上传充电站图片")
    @PostMapping("/station")
    public R<Map<String, String>> uploadStationImage(@RequestParam("file") MultipartFile file) {
        String url = minioService.uploadFile(file, "stations");
        return R.ok(Map.of("url", url));
    }

    @Operation(summary = "上传设备图片")
    @PostMapping("/device")
    public R<Map<String, String>> uploadDeviceImage(@RequestParam("file") MultipartFile file) {
        String url = minioService.uploadFile(file, "devices");
        return R.ok(Map.of("url", url));
    }

    @Operation(summary = "上传二维码")
    @PostMapping("/qrcode")
    public R<Map<String, String>> uploadQrcode(@RequestParam("file") MultipartFile file) {
        String url = minioService.uploadFile(file, "qrcodes");
        return R.ok(Map.of("url", url));
    }
}
