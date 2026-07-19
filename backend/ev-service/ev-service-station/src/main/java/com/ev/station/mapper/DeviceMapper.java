package com.ev.station.mapper;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ev.station.entity.DeviceEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

@Mapper
public interface DeviceMapper extends BaseMapper<DeviceEntity> {

    /** 批量查询站点设备总数（一次 SQL 替代 N 次 selectCount） */
    @Select("<script>" +
            "SELECT station_id, COUNT(*) AS cnt FROM device " +
            "WHERE station_id IN " +
            "<foreach collection='ids' item='id' open='(' separator=',' close=')'>" +
            "#{id}" +
            "</foreach> " +
            "GROUP BY station_id" +
            "</script>")
    List<Map<String, Object>> countByStationIds(@Param("ids") List<Long> ids);

    /** 批量查询站点在线设备数 */
    @Select("<script>" +
            "SELECT station_id, COUNT(*) AS cnt FROM device " +
            "WHERE station_id IN " +
            "<foreach collection='ids' item='id' open='(' separator=',' close=')'>" +
            "#{id}" +
            "</foreach> " +
            "AND status = 'ONLINE' " +
            "GROUP BY station_id" +
            "</script>")
    List<Map<String, Object>> countOnlineByStationIds(@Param("ids") List<Long> ids);
}
