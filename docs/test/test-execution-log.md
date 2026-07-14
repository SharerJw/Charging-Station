# EV充电平台 - 测试执行记录

## 环境
- 时间: 2026-07-15
- 后端: 6个服务 (8080-8085)
- 前端: admin-web(5173), ops-app(5175), user-miniapp(5176), simulator-web(5177)

## 执行结果

| ID | 类别 | 描述 | 状态 |
|----|------|------|------|
| G01 | Gateway | 登录 | PASS |
| G02 | Gateway | CORS | PASS |
| G03 | Gateway | 路由Station | PASS |
| G04 | Gateway | 路由Order | PASS |
| G05 | Gateway | 路由Simulator | PASS |
| I01 | Identity | 管理员登录 | PASS |
| I02 | Identity | 错误密码 | PASS |
| I03 | Identity | 空用户名 | PASS |
| I04 | Identity | Profile | PASS |
| I05 | Identity | 登出 | PASS |
| I06 | Identity | 用户列表 | PASS |
| I07 | Identity | 用户详情 | PASS |
| I08 | Identity | 无Token401 | PASS |
| I09 | Identity | 伪造Token401 | PASS |
| I10 | Identity | 运维登录 | PASS |
| I11 | Identity | 运维Profile | PASS |
| S01 | Station | 站点列表 | PASS |
| S02 | Station | 用户站点 | PASS |
| S03 | Station | 站点详情 | PASS |
| S04 | Station | 中文搜索 | PASS |
| S05 | Station | 设备列表 | PASS |
| S06 | Station | 设备详情 | PASS |
| S07 | Station | 运维站点 | PASS |
| O01 | Order | 订单列表 | PASS |
| O02 | Order | 订单筛选 | PASS |
| O03 | Order | 订单详情 | PASS |
| O04 | Order | Dashboard | PASS |
| O05 | Order | 趋势 | PASS |
| O06 | Order | 财务 | PASS |
| O07 | Order | 交易 | PASS |
| O08 | Order | 结算 | PASS |
| O09 | Order | 告警 | PASS |
| O10 | Order | 告警筛选 | PASS |
| O11 | Order | 工单 | PASS |
| O12 | Order | 巡检 | PASS |
| C01 | Charging | 启动 | PASS |
| C02 | Charging | 状态 | PASS |
| C03 | Charging | 停止 | PASS |
| C04 | Charging | 空body拒绝 | PASS |
| M01 | Simulator | 设备列表 | PASS |
| M02 | Simulator | 设备详情 | PASS |
| M03 | Simulator | 心跳 | PASS |
| M04 | Simulator | Boot | PASS |
| M05 | Simulator | 场景 | PASS |
| M06 | Simulator | OCPP | PASS |
| M07 | Simulator | 统计 | PASS |
| M08 | Simulator | 实时统计 | PASS |
| A01 | Attack | SQL注入 | PASS |
| A02 | Attack | 过期Token | PASS |
| P01 | Protocol | 响应格式 | PASS |
| P02 | Protocol | 分页格式 | PASS |

## 汇总
- 通过: 51
- 失败: 0
- 总计: 51
