package com.ev.identity.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ev.identity.entity.SysUser;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface SysUserMapper extends BaseMapper<SysUser> {

    @Select("SELECT r.code FROM sys_role r JOIN sys_user_role ur ON r.id = ur.role_id WHERE ur.user_id = #{userId}")
    List<String> selectRoleCodesByUserId(@Param("userId") Long userId);

    @Select("SELECT DISTINCT p.code FROM sys_permission p JOIN sys_role_permission rp ON p.id = rp.permission_id JOIN sys_user_role ur ON rp.role_id = ur.role_id WHERE ur.user_id = #{userId}")
    List<String> selectPermissionCodesByUserId(@Param("userId") Long userId);
}
