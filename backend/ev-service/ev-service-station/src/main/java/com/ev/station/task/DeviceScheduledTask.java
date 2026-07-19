package com.ev.station.task;

import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.ev.station.entity.DeviceEntity;
import com.ev.station.mapper.DeviceMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * 设备定时任务
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DeviceScheduledTask {

    private final DeviceMapper deviceMapper;

    /**
     * 设备心跳检测 - 每2分钟执行
     * 将最后更新时间超过5分钟且状态为 ONLINE 的设备标记为 OFFLINE
     *
     * 注意：当前通过设备 updatedAt 字段判断心跳状态。
     * 设备上报心跳时应同步更新 updatedAt 字段。
     */
    @Scheduled(cron = "0 */2 * * * ?")
    public void checkDeviceHeartbeat() {
        LocalDateTime deadline = LocalDateTime.now().minusMinutes(5);

        LambdaUpdateWrapper<DeviceEntity> wrapper = new LambdaUpdateWrapper<>();
        wrapper.eq(DeviceEntity::getStatus, "ONLINE")
                .le(DeviceEntity::getUpdatedAt, deadline)
                .set(DeviceEntity::getStatus, "OFFLINE");

        int updated = deviceMapper.update(null, wrapper);
        if (updated > 0) {
            log.info("设备心跳检测：本次标记 {} 台设备为 OFFLINE（心跳超时阈值5分钟）", updated);
        }
    }
}
