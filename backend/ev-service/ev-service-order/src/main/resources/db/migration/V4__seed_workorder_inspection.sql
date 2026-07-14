-- 预置工单数据
INSERT INTO work_order (order_no, type, title, description, station_id, station_name, device_id, device_code, priority, status, creator, assignee, result, accept_time, complete_time) VALUES
('WO-20260713-001', 'repair', 'DEV-004设备离线维修', '设备DEV-004已离线超过30分钟，需现场检查', 1, '朝阳区超级充电站', 4, 'DEV-004', 'high', 'completed', '系统自动', '运维工程师', '已重启设备，恢复正常', '2026-07-13T08:30:00Z', '2026-07-13T09:00:00Z'),
('WO-20260713-002', 'repair', 'DEV-006充电模块故障', '充电模块过温保护触发，需更换散热风扇', 2, '浦东新区快充站', 6, 'DEV-006', 'high', 'accepted', '系统自动', '运维工程师', NULL, '2026-07-13T10:00:00Z', NULL),
('WO-20260713-003', 'maintenance', 'DEV-011固件升级', '设备固件需要升级到v2.0.0', 4, '南山区科技园充电站', 11, 'DEV-011', 'medium', 'pending', '管理员', NULL, NULL, NULL, NULL),
('WO-20260713-004', 'inspection', '月度巡检-朝阳站', '朝阳区超级充电站月度例行巡检', 1, '朝阳区超级充电站', NULL, NULL, 'low', 'processing', '管理员', '运维工程师', NULL, '2026-07-13T07:00:00Z', NULL),
('WO-20260713-005', 'repair', 'DEV-009接地故障', '接地故障检测告警需排查', 3, '天河区充电站', 9, 'DEV-009', 'high', 'pending', '系统自动', NULL, NULL, NULL, NULL)
ON CONFLICT (order_no) DO NOTHING;

-- 预置巡检任务
INSERT INTO inspection_task (name, station_id, station_name, device_count, item_count, status, plan_time, start_time, complete_time, inspector) VALUES
('朝阳站日巡检', 1, '朝阳区超级充电站', 4, 12, 'completed', '2026-07-13T08:00:00Z', '2026-07-13T08:10:00Z', '2026-07-13T09:00:00Z', '运维工程师'),
('浦东站日巡检', 2, '浦东新区快充站', 3, 9, 'in_progress', '2026-07-13T09:00:00Z', '2026-07-13T09:15:00Z', NULL, '运维工程师'),
('天河站周巡检', 3, '天河区充电站', 3, 15, 'pending', '2026-07-14T08:00:00Z', NULL, NULL, NULL),
('南山站月度巡检', 4, '南山区科技园充电站', 1, 8, 'pending', '2026-07-15T10:00:00Z', NULL, NULL, NULL),
('西湖站日巡检', 5, '西湖区充电站', 2, 6, 'completed', '2026-07-12T08:00:00Z', '2026-07-12T08:05:00Z', '2026-07-12T08:45:00Z', '运维工程师')
ON CONFLICT DO NOTHING;
