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

    /**
     * 查询用户的数据权限范围
     * 返回第一个匹配的数据权限范围（优先级：全部 > 本机构及下级 > 仅本机构 > 仅本人）
     */
    @Select("""
            SELECT dp.data_scope FROM sys_data_permission dp
            JOIN sys_role_data_permission rdp ON dp.id = rdp.data_permission_id
            JOIN sys_user_role ur ON rdp.role_id = ur.role_id
            WHERE ur.user_id = #{userId}
            ORDER BY dp.id ASC
            LIMIT 1
            """)
    String selectDataScopeByUserId(@Param("userId") Long userId);
}
