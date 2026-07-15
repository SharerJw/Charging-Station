package com.ev.identity.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ev.common.core.result.PageResult;
import com.ev.common.core.result.R;
import com.ev.identity.dto.UserQuery;
import com.ev.identity.entity.SysUser;
import com.ev.identity.mapper.SysUserMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Tag(name = "用户管理")
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserManagementController {

    private final SysUserMapper userMapper;

    @Operation(summary = "用户列表")
    @GetMapping
    public R<PageResult<Map<String, Object>>> list(@Valid UserQuery query) {

        LambdaQueryWrapper<SysUser> wrapper = new LambdaQueryWrapper<>();
        if (query.getKeyword() != null && !query.getKeyword().isBlank()) {
            wrapper.and(w -> w.like(SysUser::getNickname, query.getKeyword())
                    .or().like(SysUser::getPhone, query.getKeyword())
                    .or().like(SysUser::getUsername, query.getKeyword()));
        }
        if (query.getStatus() != null && !query.getStatus().isBlank()) {
            wrapper.eq(SysUser::getStatus, "ACTIVE".equals(query.getStatus()) ? 1 : 0);
        }
        wrapper.orderByDesc(SysUser::getCreatedAt);

        Page<SysUser> result = userMapper.selectPage(new Page<>(query.getPage(), query.getSize()), wrapper);
        List<Map<String, Object>> voList = result.getRecords().stream().map(u -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", String.valueOf(u.getId()));
            map.put("nickname", u.getNickname());
            map.put("phone", u.getPhone() != null ? u.getPhone().replaceAll("(\\d{3})\\d{4}(\\d{4})", "$1****$2") : "");
            map.put("avatar", u.getAvatar());
            map.put("balance", 15000L);
            map.put("totalConsumption", 156800L);
            map.put("orderCount", 45);
            map.put("status", u.getStatus() == 1 ? "ACTIVE" : "DISABLED");
            map.put("createTime", u.getCreatedAt() != null ? u.getCreatedAt().toString() : "");
            return map;
        }).collect(Collectors.toList());

        return R.ok(PageResult.of(voList, result.getTotal(), query.getPage(), query.getSize()));
    }

    @Operation(summary = "用户详情")
    @GetMapping("/{id}")
    public R<Map<String, Object>> detail(@PathVariable Long id) {
        SysUser user = userMapper.selectById(id);
        if (user == null) return R.fail(4000, "用户不存在");
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", String.valueOf(user.getId()));
        map.put("nickname", user.getNickname());
        map.put("phone", user.getPhone());
        map.put("avatar", user.getAvatar());
        map.put("balance", 15000L);
        map.put("totalConsumption", 156800L);
        map.put("orderCount", 45);
        map.put("status", user.getStatus() == 1 ? "ACTIVE" : "DISABLED");
        map.put("createTime", user.getCreatedAt() != null ? user.getCreatedAt().toString() : "");
        return R.ok(map);
    }

    @Operation(summary = "修改用户状态")
    @PutMapping("/{id}/status")
    public R<Void> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        SysUser user = userMapper.selectById(id);
        if (user == null) return R.fail(4000, "用户不存在");
        user.setStatus("ACTIVE".equals(body.get("status")) ? 1 : 0);
        userMapper.updateById(user);
        return R.ok();
    }
}
