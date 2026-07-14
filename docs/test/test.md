# EV充电平台 - 全面测试方案

## 一、后端API测试方案

### 1.1 Gateway服务 (8080)
| ID | 描述 | 方法 | 路径 | 预期 | 状态 |
|----|------|------|------|------|------|
| G01 | 登录获取Token | POST | /api/auth/login | code=0 | ✅ |
| G02 | CORS头 | OPTIONS | /api/v1/stations | Allow-Origin存在 | ✅ |
| G03 | 路由Identity | GET | /api/auth/profile | code=0 | ✅ |
| G04 | 路由Station | GET | /api/v1/stations | code=0 | ✅ |
| G05 | 路由Order | GET | /api/v1/orders | code=0 | ✅ |
| G06 | 路由Simulator | GET | /api/simulator/devices | code=0 | ✅ |

### 1.2 Identity服务 (8081)
| ID | 描述 | 方法 | 路径 | 预期 | 状态 |
|----|------|------|------|------|------|
| I01 | 管理员登录 | POST | /api/auth/login | code=0,token | ✅ |
| I02 | 错误密码 | POST | /api/auth/login | code!=0 | ✅ |
| I03 | 空用户名 | POST | /api/auth/login | code!=0 | ✅ |
| I04 | Profile | GET | /api/auth/profile | code=0 | ✅ |
| I05 | 登出 | POST | /api/auth/logout | code=0 | ✅ |
| I06 | 用户列表 | GET | /api/users | code=0 | ✅ |
| I07 | 用户详情 | GET | /api/users/1 | code=0 | ✅ |
| I08 | 无Token | GET | /api/auth/profile | 401 | ✅ |
| I09 | 伪造Token | GET | /api/auth/profile | 401 | ✅ |
| I10 | 运维登录 | POST | /api/v1/ops/auth/login | code=0 | ✅ |
| I11 | 运维Profile | GET | /api/v1/ops/user/profile | code=0 | ✅ |

### 1.3 Station服务 (8082)
| ID | 描述 | 方法 | 路径 | 预期 | 状态 |
|----|------|------|------|------|------|
| S01 | 站点列表 | GET | /api/stations | code=0 | ✅ |
| S02 | 用户站点 | GET | /api/v1/stations | code=0 | ✅ |
| S03 | 站点详情 | GET | /api/stations/1 | code=0 | ✅ |
| S04 | 中文搜索 | GET | /api/v1/stations?keyword=朝阳 | code=0 | ✅ |
| S05 | 设备列表 | GET | /api/devices?stationId=1 | code=0 | ✅ |
| S06 | 设备详情 | GET | /api/devices/1 | code=0 | ✅ |
| S07 | 运维站点 | GET | /api/v1/ops/stations | code=0 | ✅ |

### 1.4 Order服务 (8083)
| ID | 描述 | 方法 | 路径 | 预期 | 状态 |
|----|------|------|------|------|------|
| O01 | 订单列表 | GET | /api/v1/orders | code=0 | ✅ |
| O02 | 订单筛选 | GET | /api/v1/orders?status=PAID | code=0 | ✅ |
| O03 | 订单详情 | GET | /api/orders/1 | code=0 | ✅ |
| O04 | Dashboard | GET | /api/dashboard/overview | code=0 | ✅ |
| O05 | 趋势 | GET | /api/dashboard/trend | code=0 | ✅ |
| O06 | 财务 | GET | /api/finance/overview | code=0 | ✅ |
| O07 | 交易 | GET | /api/finance/transactions | code=0 | ✅ |
| O08 | 结算 | GET | /api/finance/settlement | code=0 | ✅ |
| O09 | 告警 | GET | /api/v1/ops/alerts | code=0 | ✅ |
| O10 | 告警筛选 | GET | /api/v1/ops/alerts?level=P1 | code=0 | ✅ |
| O11 | 工单 | GET | /api/v1/ops/workorders | code=0 | ✅ |
| O12 | 巡检 | GET | /api/v1/ops/inspections | code=0 | ✅ |

### 1.5 Charging服务 (8084)
| ID | 描述 | 方法 | 路径 | 预期 | 状态 |
|----|------|------|------|------|------|
| C01 | 启动充电 | POST | /api/v1/charging/start | code=0 | ✅ |
| C02 | 充电状态 | GET | /api/v1/charging/{id}/status | code=0 | ✅ |
| C03 | 停止充电 | POST | /api/v1/charging/{id}/stop | code=0 | ✅ |
| C04 | 空body | POST | /api/v1/charging/start | code!=0 | ✅ |

### 1.6 Simulator服务 (8085)
| ID | 描述 | 方法 | 路径 | 预期 | 状态 |
|----|------|------|------|------|------|
| M01 | 设备列表 | GET | /api/simulator/devices | code=0 | ✅ |
| M02 | 设备详情 | GET | /api/simulator/devices/CP001 | code=0 | ✅ |
| M03 | 心跳 | POST | /api/simulator/devices/CP001/heartbeat | code=0 | ✅ |
| M04 | Boot | POST | /api/simulator/devices/CP001/boot | code=0 | ✅ |
| M05 | 场景 | GET | /api/simulator/scenarios | code=0 | ✅ |
| M06 | OCPP | POST | /api/simulator/ocpp/send | code=0 | ✅ |
| M07 | 统计 | GET | /api/simulator/stats | code=0 | ✅ |
| M08 | 实时统计 | GET | /api/simulator/stats/realtime | code=0 | ✅ |

### 1.7 安全测试
| ID | 描述 | 预期 | 状态 |
|----|------|------|------|
| A01 | SQL注入搜索 | 返回空结果，不泄露 | ✅ |
| A02 | 过期Token | 401拒绝 | ✅ |
| A03 | 无Token访问 | 401拒绝 | ✅ |
| A04 | 空body POST | 返回错误码 | ✅ |

### 1.8 协议测试
| ID | 描述 | 预期 | 状态 |
|----|------|------|------|
| P01 | 响应格式 | {code,message,data} | ✅ |
| P02 | 分页格式 | {list,total,page,size} | ✅ |

---

## 二、前端测试方案

### 2.1 admin-web (5173)
| ID | 页面 | 检查项 | 预期 | 状态 |
|----|------|--------|------|------|
| AW01 | 登录 | 输入框存在 | 可输入 | ✅ |
| AW02 | 登录 | 错误密码 | 显示错误 | ✅ |
| AW03 | 登录 | 正确登录 | 跳转/dashboard | ✅ |
| AW04 | 仪表盘 | 统计卡片 | 非NaN | ✅ |
| AW05 | 仪表盘 | 订单表格 | 显示5条数据 | ✅ |
| AW06 | 仪表盘 | 待办事项 | 数字正确 | ✅ |
| AW07 | 仪表盘 | Console | 0 errors | ✅ |
| AW08 | 站点 | 站点列表 | 显示7个站点 | ✅ |
| AW09 | 订单 | 订单列表 | Total=20 | ✅ |

### 2.2 simulator-web (5177)
| ID | 页面 | 检查项 | 预期 | 状态 |
|----|------|--------|------|------|
| SW01 | 仪表盘 | 设备卡片 | 8个设备 | ✅ |
| SW02 | 仪表盘 | 状态标签 | 在线/离线 | ✅ |
| SW03 | 仪表盘 | OCPP事件 | 有事件 | ✅ |

### 2.3 ops-app (5175)
| ID | 页面 | 检查项 | 预期 | 状态 |
|----|------|--------|------|------|
| OP01 | 工作台 | 统计数据 | 有数字 | ✅ |
| OP02 | 工作台 | 快捷操作 | 4按钮 | ✅ |
| OP03 | 工作台 | 告警列表 | 有数据 | ✅ |

### 2.4 user-miniapp (5176)
| ID | 页面 | 检查项 | 预期 | 状态 |
|----|------|--------|------|------|
| UM01 | 首页 | 余额 | 显示金额 | ✅ |
| UM02 | 首页 | 快捷操作 | 4按钮 | ✅ |
| UM03 | 首页 | 充电站 | 有站点 | ✅ |

---

## 三、汇总

- 后端API: 51/51 ✅
- 前端测试: 15/15 ✅
- 安全测试: 4/4 ✅
- 协议测试: 2/2 ✅
- **总计: 72/72 ✅ 全通过**
