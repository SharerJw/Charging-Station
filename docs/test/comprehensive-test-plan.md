# EV充电平台 - 十维度全面测试方案

> 版本: v1.0 | 日期: 2026-07-15 | 用例总数: 500+

## 文档说明

本方案覆盖EV充电平台的**全部**后端服务（Gateway/Identity/Station/Order/Charging/Simulator）和**全部**前端应用（admin-web/ops-app/user-miniapp/simulator-web），从十个维度进行无死角测试。

### 用例格式

| 字段 | 说明 |
|------|------|
| ID | 唯一标识，格式：维度前缀-序号 |
| P | 优先级：P0(必测) P1(重要) P2(一般) P3(边缘) |
| 描述 | 测试目标简述 |
| 步骤 | 具体操作步骤 |
| 预期 | 期望结果 |
| 服务 | 涉及的后端服务/前端App |

---

## 一、拟人化测试 (55用例)

### 1.1 用户行为模拟 (20用例)

| ID | P | 描述 | 步骤 | 预期 | 服务 |
|----|---|------|------|------|------|
| H-001 | P0 | 新用户首次登录-正确凭据 | 1.打开admin-web 2.输入admin/admin123 3.点击登录 | 跳转到dashboard，URL变为/dashboard | Identity, admin-web |
| H-002 | P0 | 新用户首次登录-错误密码 | 1.输入admin/wrong 2.点击登录 | 显示错误提示"密码错误"，不跳转 | Identity, admin-web |
| H-003 | P0 | 新用户首次登录-空字段 | 1.不输入任何内容 2.点击登录 | 表单验证提示"用户名不能为空""密码不能为空" | admin-web |
| H-004 | P1 | 登录后浏览全部菜单 | 1.登录后依次点击左侧12个菜单项 | 每个页面正常加载，无白屏 | admin-web |
| H-005 | P1 | 登出后重新登录 | 1.点击登出 2.重新输入凭据登录 | 登出成功，重新登录成功，数据一致 | Identity, admin-web |
| H-006 | P1 | 快速连续点击登录按钮 | 1.快速双击/三击登录按钮 | 不重复提交，不产生多个session | Identity, admin-web |
| H-007 | P1 | 快速连续点击提交按钮 | 1.在创建站点页面快速双击"提交" | 只创建一条记录，不重复 | Station, admin-web |
| H-008 | P2 | 长时间停留后操作 | 1.登录后等待10分钟不做操作 2.然后点击菜单 | 页面不白屏，操作有效（或提示重新登录） | admin-web |
| H-009 | P2 | 浏览器前进后退 | 1.在站点列表点击详情 2.点击浏览器后退 | 回到站点列表，数据正确 | admin-web |
| H-010 | P1 | 多标签页同时操作 | 1.打开3个admin-web标签 2.在标签A创建站点 3.切换到标签B刷新 | 标签B能看到新创建的站点 | admin-web, Station |
| H-011 | P2 | 表单填写中途放弃 | 1.填写创建站点表单一半 2.点击其他菜单 3.返回创建页面 | 表单重置或提示未保存 | admin-web |
| H-012 | P1 | 搜索防抖测试 | 1.在站点搜索框快速输入"朝阳区超级充电站" | 不逐字发请求，输入停顿后才搜索 | admin-web, Station |
| H-013 | P2 | 滚动加载列表 | 1.打开订单列表 2.快速滚动到底部 | 触发分页加载，无闪烁，数据正确追加 | admin-web, Order |
| H-014 | P2 | 切换分页大小 | 1.在订单列表切换每页10→20→50 | 列表正确刷新，总数不变 | admin-web, Order |
| H-015 | P1 | 筛选条件组合 | 1.在订单页面选择状态=PAID 2.输入订单号搜索 | 返回同时满足两个条件的结果 | admin-web, Order |
| H-016 | P2 | 重置筛选条件 | 1.设置多个筛选条件 2.点击"重置"按钮 | 所有筛选清空，显示全部数据 | admin-web |
| H-017 | P1 | 充电完整用户旅程 | 1.用户登录→找桩→扫码→开始充电→查看状态→停止充电→查看订单→支付 | 全流程无错误，状态正确流转 | 全部 |
| H-018 | P1 | 运维完整工作旅程 | 1.运维登录→查看告警→处理告警→查看工单→接单→完成工单→巡检 | 全流程无错误 | Order, ops-app |
| H-019 | P2 | 管理员完整管理旅程 | 1.登录→查看仪表盘→管理站点→管理设备→查看订单→查看财务→管理用户 | 全页面可访问，数据正确 | 全部 |
| H-020 | P3 | 模拟器完整操作旅程 | 1.打开模拟器→查看设备→选择设备→启动充电→查看实时数据→停止充电→查看统计 | 全流程无错误 | Simulator, simulator-web |

### 1.2 视觉/交互验证 (20用例)

| ID | P | 描述 | 步骤 | 预期 | 服务 |
|----|---|------|------|------|------|
| V-001 | P0 | 页面加载完整性 | 1.打开每个页面 2.检查DOM元素 | 无空白区域，无loading卡死 | 全部前端 |
| V-002 | P0 | 数据格式化-金额 | 1.查看订单列表的金额列 | 显示¥符号+数字，如¥72.35，无NaN | admin-web |
| V-003 | P0 | 数据格式化-电量 | 1.查看订单的电量列 | 显示数字+kWh，如45.5 kWh，无undefined | admin-web |
| V-004 | P0 | 数据格式化-百分比 | 1.查看仪表盘的设备在线率 | 显示98.5%，无NaN | admin-web |
| V-005 | P1 | 状态标签颜色-运营中 | 1.查看站点列表状态列 | 运营中显示绿色标签 | admin-web |
| V-006 | P1 | 状态标签颜色-维护中 | 1.查看有维护中状态的站点 | 维护中显示黄色/橙色标签 | admin-web |
| V-007 | P1 | 状态标签颜色-离线 | 1.查看设备状态 | 离线显示红色/灰色标签 | admin-web |
| V-008 | P1 | 订单状态颜色 | 1.查看订单列表各状态 | PAID=绿, CHARGING=蓝, ABNORMAL=红, REFUNDING=橙 | admin-web |
| V-009 | P1 | 表格排序功能 | 1.点击站点列表"编号"列头排序 | 数据按编号升序/降序排列 | admin-web |
| V-010 | P2 | 响应式布局-1920px | 1.将浏览器窗口设为1920x1080 | 布局正常，侧边栏展开 | admin-web |
| V-011 | P2 | 响应式布局-1366px | 1.将浏览器窗口设为1366x768 | 布局正常，内容不溢出 | admin-web |
| V-012 | P2 | 响应式布局-768px | 1.将浏览器窗口设为768px宽 | 侧边栏折叠，内容可读 | admin-web |
| V-013 | P1 | 中文显示正确性 | 1.检查所有页面的中文文字 | 无乱码，无方块字符，无??? | 全部前端 |
| V-014 | P1 | 数字千分位 | 1.查看仪表盘的"今日充电量" | 显示8,901kWh（有千分位逗号） | admin-web |
| V-015 | P1 | 图表渲染 | 1.查看仪表盘的营收趋势图 | ECharts图表正确渲染，有数据点 | admin-web |
| V-016 | P1 | 图表交互 | 1.鼠标悬停在图表数据点上 | 显示tooltip，数据正确 | admin-web |
| V-017 | P2 | 加载状态-skeleton | 1.在慢网络下打开页面 | 显示骨架屏/loading，不假死 | admin-web |
| V-018 | P2 | 空数据状态 | 1.搜索一个不存在的关键词 | 显示"暂无数据"提示，不空白 | admin-web |
| V-019 | P1 | 导航高亮 | 1.点击"站点管理"菜单 | 菜单项高亮，面包屑正确 | admin-web |
| V-020 | P2 | 页面标题 | 1.切换不同页面 | 浏览器标签标题跟随变化，如"站点管理 - 后台管理" | admin-web |

### 1.3 移动端拟人测试 (15用例)

| ID | P | 描述 | 步骤 | 预期 | 服务 |
|----|---|------|------|------|------|
| M-001 | P0 | ops-app工作台加载 | 1.打开ops-app H5 | 显示统计卡片+快捷操作+告警列表 | ops-app |
| M-002 | P0 | user-miniapp首页加载 | 1.打开user-miniapp H5 | 显示余额+充电站+快捷操作 | user-miniapp |
| M-003 | P1 | ops-app底部导航切换 | 1.依次点击 工作台/告警/工单/我的 | 4个tab正常切换，内容正确 | ops-app |
| M-004 | P1 | user-miniapp底部导航切换 | 1.依次点击 首页/找桩/订单/我的 | 4个tab正常切换 | user-miniapp |
| M-005 | P1 | ops-app告警详情 | 1.点击一条告警记录 | 显示告警详情，有处理按钮 | ops-app |
| M-006 | P1 | ops-app工单操作 | 1.点击待办工单 2.点击"接单" 3.点击"完成" | 状态从pending→accepted→completed | ops-app, Order |
| M-007 | P1 | user-miniapp充电站详情 | 1.点击一个充电站 | 显示站点详情+可用枪数+价格 | user-miniapp, Station |
| M-008 | P2 | ops-app下拉刷新 | 1.在工作台下拉刷新 | 数据更新，loading消失 | ops-app |
| M-009 | P2 | user-miniapp找桩地图 | 1.点击"找桩"tab | 显示地图+附近充电站标记 | user-miniapp |
| M-010 | P2 | ops-app横屏适配 | 1.将手机横屏 | 布局不错乱 | ops-app |
| M-011 | P2 | user-miniapp扫码入口 | 1.点击"扫码充电"按钮 | 调起扫码功能或提示 | user-miniapp |
| M-012 | P3 | ops-app网络断开 | 1.断开网络 2.操作页面 | 显示网络错误提示，不崩溃 | ops-app |
| M-013 | P3 | user-miniapp网络断开 | 1.断开网络 2.操作页面 | 显示网络错误提示 | user-miniapp |
| M-014 | P2 | simulator-web设备选择 | 1.在设备下拉框切换设备 | 实时数据切换到新设备 | simulator-web |
| M-015 | P2 | simulator-web暂停/恢复 | 1.点击"暂停"按钮 2.再点击"恢复" | 数据停止/恢复更新 | simulator-web |

---

## 二、恶劣环境测试 (55用例)

### 2.1 请求攻击 (15用例)

| ID | P | 描述 | 步骤 | 预期 | 服务 |
|----|---|------|------|------|------|
| A-001 | P0 | SQL注入-搜索字段 | GET /api/v1/stations?keyword=' OR 1=1 -- | 返回空结果，不泄露全部数据，SQL不执行 | Station |
| A-002 | P0 | SQL注入-登录字段 | POST /api/auth/login {"username":"' OR '1'='1","password":"x"} | 登录失败，不绕过认证 | Identity |
| A-003 | P0 | SQL注入-ID字段 | GET /api/stations/1' OR '1'='1 | 返回400或404，不返回全部站点 | Station |
| A-004 | P0 | SQL注入-排序字段 | GET /api/v1/orders?sort=name;DROP TABLE-- | 参数被忽略或转义，表不被删除 | Order |
| A-005 | P0 | XSS-存储型 | POST /api/stations {"name":"<script>alert(1)</script>"} | 存储时转义或拒绝，页面不执行脚本 | Station, admin-web |
| A-006 | P0 | XSS-反射型 | GET /api/v1/stations?keyword=<img onerror=alert(1)> | 响应中脚本标签被转义 | Station |
| A-007 | P1 | XSS-DOM型 | 在前端输入框输入javascript:alert(1) | 不执行脚本 | admin-web |
| A-008 | P1 | 命令注入 | POST /api/stations {"name":"; ls -la"} | 参数被当作字符串处理，不执行命令 | Station |
| A-009 | P1 | 路径遍历 | GET /api/../../../etc/passwd | 返回404，不泄露服务器文件 | Gateway |
| A-010 | P1 | 路径遍历-编码绕过 | GET /api/..%2F..%2Fetc/passwd | 返回404，URL编码被正确处理 | Gateway |
| A-011 | P2 | SSRF攻击 | POST /api/stations {"logo":"http://169.254.169.254/latest/meta-data/"} | 不访问内网地址 | Station |
| A-012 | P2 | XML注入 | POST Content-Type: application/xml 带XXE payload | Content-Type不匹配时拒绝，不解析XML | Gateway |
| A-013 | P1 | HTTP头注入 | 注入 CRLF 到响应头 | 不注入额外响应头 | Gateway |
| A-014 | P2 | Host头攻击 | 请求头 Host: evil.com | 不基于Host头生成链接/重定向 | Gateway |
| A-015 | P1 | JSONP劫持 | GET /api/auth/profile?callback=evil | 不支持JSONP回调 | Identity |

### 2.2 数据污染 (15用例)

| ID | P | 描述 | 步骤 | 预期 | 服务 |
|----|---|------|------|------|------|
| D-001 | P0 | 超长字符串-10KB | POST /api/stations {"name":"A"*10000} | 验证器拒绝或截断，不崩溃 | Station |
| D-002 | P0 | 超长字符串-100KB | POST body 100KB的JSON | 返回400或413，不OOM | Gateway |
| D-003 | P0 | 超长字符串-1MB | POST body 1MB的JSON | 请求被拒绝，服务稳定 | Gateway |
| D-004 | P0 | 空请求体 | POST /api/v1/charging/start {} | 返回字段验证错误，不500 | Charging |
| D-005 | P0 | 空请求体-无Content-Type | POST不带Content-Type头 | 返回400或415 | Gateway |
| D-006 | P0 | 畸形JSON | POST body: {invalid json | 返回400，服务不崩溃 | Gateway |
| D-007 | P1 | 畸形JSON-嵌套过深 | POST body: {"a":{"a":{"a":...1000层...}}} | 返回400，不StackOverflow | Gateway |
| D-008 | P1 | 畸形JSON-数组过长 | POST body: {"data":[1,2,...100000个元素...]} | 返回400或截断 | Gateway |
| D-009 | P1 | 负数金额 | POST /api/v1/charging/start 带负数价格 | 拒绝或修正为0 | Charging |
| D-010 | P1 | 负数ID | GET /api/stations/-1 | 返回400或404，不崩溃 | Station |
| D-011 | P1 | 零值ID | GET /api/stations/0 | 返回404 | Station |
| D-012 | P1 | 超大数字 | POST {"price":99999999999999999} | 数值溢出处理，不崩溃 | Station |
| D-013 | P2 | 未来时间戳 | POST {"startTime":"2099-01-01T00:00:00"} | 拒绝或使用当前时间 | Order |
| D-014 | P2 | 过去时间戳 | POST {"startTime":"1970-01-01T00:00:00"} | 接受或拒绝，不崩溃 | Order |
| D-015 | P1 | 特殊字符集 | POST含emoji、零宽字符、RTL字符 | 正确存储和显示，不乱码 | Station |

### 2.3 协议攻击 (15用例)

| ID | P | 描述 | 步骤 | 预期 | 服务 |
|----|---|------|------|------|------|
| P-001 | P0 | HTTP方法错误 | DELETE /api/v1/stations (GET端点) | 返回405 Method Not Allowed | Station |
| P-002 | P0 | HTTP方法错误-TRACE | TRACE /api/v1/stations | 返回405，不回显请求 | Gateway |
| P-003 | P0 | HTTP方法错误-OPTIONS | OPTIONS /api/v1/stations | 返回200，含Allow头 | Gateway |
| P-004 | P1 | HTTP/1.0请求 | 发送HTTP/1.0请求 | 正常处理或返回505 | Gateway |
| P-005 | P1 | 超大请求头 | Cookie头设为100KB | 返回400或431，不崩溃 | Gateway |
| P-006 | P1 | 超多请求头 | 发送100个自定义Header | 正常处理或返回431 | Gateway |
| P-007 | P2 | 分块传输编码 | 使用Transfer-Encoding: chunked发送畸形chunk | 正确处理或拒绝 | Gateway |
| P-008 | P2 | Content-Length不匹配 | Content-Length: 100 但body只有10字节 | 超时后返回400 | Gateway |
| P-009 | P1 | 重复Content-Length | 发送两个Content-Length头 | 使用第一个或拒绝 | Gateway |
| P-010 | P2 | HTTP请求走私 | Content-Length和Transfer-Encoding冲突 | 不走私请求 | Gateway |
| P-011 | P1 | WebSocket升级-非预期路径 | 对/api/stations发送Upgrade:websocket | 返回400或忽略Upgrade头 | Gateway |
| P-012 | P2 | 慢速攻击-Slowloris | 极慢地发送请求头（每秒1字节） | 连接超时被关闭 | Gateway |
| P-013 | P2 | HTTP/2降级攻击 | 尝试降级HTTP/2到HTTP/1.1 | 按协议规范处理 | Gateway |
| P-014 | P3 | 无效URL编码 | GET /api/stations/%GG%HH | 返回400 | Gateway |
| P-015 | P1 | Unicode规范化攻击 | 使用不同Unicode编码的同形字作为路径 | 正确路由或返回404 | Gateway |

### 2.4 资源耗尽 (10用例)

| ID | P | 描述 | 步骤 | 预期 | 服务 |
|----|---|------|------|------|------|
| R-001 | P0 | 并发100个请求 | 100个并发GET /api/v1/stations | 全部返回200，响应时间<5s | Gateway, Station |
| R-002 | P0 | 并发1000个请求 | 1000个并发GET /api/v1/stations | 限流生效，部分返回429，不崩溃 | Gateway |
| R-003 | P1 | 连续快速请求-无间隔 | 每秒100个请求持续10秒 | 限流生效，服务稳定 | Gateway |
| R-004 | P1 | 大量并发登录 | 50个并发POST /api/auth/login | 全部正确处理，不产生重复session | Identity |
| R-005 | P1 | 大量并发充电启动 | 20个并发POST /api/v1/charging/start | 不超卖，每个充电会话独立 | Charging |
| R-006 | P2 | 长连接不释放 | 打开100个HTTP连接不关闭 | 连接池管理正常，不耗尽 | Gateway |
| R-007 | P2 | 大量分页请求 | 翻到第10000页 | 返回空数据，不OOM | Order |
| R-008 | P1 | 数据库连接池测试 | 并发50个数据库查询 | 连接池正确管理，不泄漏 | Station |
| R-009 | P2 | Redis连接池测试 | 并发100个缓存操作 | 连接池正确管理 | 全部 |
| R-010 | P1 | 内存泄漏检测 | 持续运行1小时，监控JVM内存 | 内存稳定，无持续增长 | 全部 |

---

## 三、API安全测试 (55用例)

### 3.1 认证绕过 (15用例)

| ID | P | 描述 | 步骤 | 预期 | 服务 |
|----|---|------|------|------|------|
| S-001 | P0 | 无Token访问受保护端点 | GET /api/v1/orders 不带Authorization | 返回401 | Order |
| S-002 | P0 | 空Token | Authorization: Bearer (空) | 返回401 | Gateway |
| S-003 | P0 | 伪造JWT | Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.fake | 返回401，签名验证失败 | Gateway |
| S-004 | P0 | 过期JWT | 使用exp=过去的Token | 返回401 | Gateway |
| S-005 | P0 | 未签名JWT | Authorization: Bearer eyJhbGciOiJub25lIn0.eyJzdWIiOiIxIn0. | 返回401，拒绝none算法 | Gateway |
| S-006 | P1 | 算法混淆攻击 | 将alg从HS256改为RS256 | 返回401 | Gateway |
| S-007 | P1 | JWT Kid注入 | 修改JWT header的kid字段 | 不导致路径遍历或命令注入 | Gateway |
| S-008 | P1 | 刷新Token后旧Token | 1.获取TokenA 2.刷新得到TokenB 3.用TokenA访问 | TokenA仍有效（或被撤销） | Identity |
| S-009 | P2 | 并发Token刷新 | 50个并发刷新Token请求 | 不产生冲突，返回有效Token | Identity |
| S-010 | P1 | Session固定攻击 | 使用已知session ID尝试登录 | 登录后生成新session ID | Identity |
| S-011 | P1 | 密码暴力破解 | 连续100次错误密码登录 | 限流或锁定，不泄露有效用户名 | Identity |
| S-012 | P2 | 用户名枚举 | 用不存在的用户名登录 vs 存在的用户名 | 错误消息一致，不区分"用户不存在"和"密码错误" | Identity |
| S-013 | P1 | Token中篡改userId | 修改JWT payload的userId字段 | 签名验证失败，返回401 | Gateway |
| S-014 | P1 | Token中篡改tenantId | 修改JWT payload的tenantId字段 | 签名验证失败 | Gateway |
| S-015 | P2 | Token中添加admin角色 | 修改JWT payload的roles字段 | 签名验证失败 | Gateway |

### 3.2 授权越权 (15用例)

| ID | P | 描述 | 步骤 | 预期 | 服务 |
|----|---|------|------|------|------|
| Z-001 | P0 | 普通用户访问管理端点 | 用普通用户Token GET /api/users | 返回403或401 | Identity |
| Z-002 | P0 | 运维用户访问财务端点 | 用运维Token GET /api/finance/overview | 返回403 | Order |
| Z-003 | P0 | 水平越权-查看他人订单 | 用用户A的Token GET /api/v1/orders/用户B的订单ID | 返回403或只返回自己的 | Order |
| Z-004 | P0 | 水平越权-修改他人站点 | 用租户A的Token PUT /api/stations/租户B的站点ID | 返回403 | Station |
| Z-005 | P1 | 垂直越权-普通用户删除站点 | 用普通用户Token DELETE /api/stations/1 | 返回403 | Station |
| Z-006 | P1 | ID遍历 | 顺序GET /api/users/1, /2, /3.../100 | 只返回有权限的用户 | Identity |
| Z-007 | P1 | ID遍历-订单 | 顺序GET /api/orders/1, /2, /3... | 只返回有权限的订单 | Order |
| Z-008 | P1 | 租户隔离验证 | 用租户A Token查询，不应看到租户B数据 | 查询结果只含租户A数据 | Station |
| Z-009 | P2 | API路径大小写 | GET /API/V1/STATIONS | 返回404或正确路由 | Gateway |
| Z-010 | P2 | API路径双重编码 | GET /api/v1/%73tations (%73=s) | 返回404或正确路由 | Gateway |
| Z-011 | P1 | 批量操作越权 | 用普通用户Token批量删除站点 | 返回403 | Station |
| Z-012 | P2 | 角色降权后Token有效 | 1.管理员登录获取Token 2.后台降权 3.用原Token访问 | Token被撤销或权限重新检查 | Identity |
| Z-013 | P2 | 账号禁用后Token有效 | 1.用户登录 2.后台禁用用户 3.用原Token访问 | 返回401或403 | Identity |
| Z-014 | P1 | CORS绕过 | Origin: http://evil.com 的请求 | 不返回Access-Control-Allow-Origin: evil.com | Gateway |
| Z-015 | P2 | Referer绕过 | Referer: http://evil.com 的请求 | 不基于Referer做授权 | Gateway |

### 3.3 注入与数据泄露 (15用例)

| ID | P | 描述 | 步骤 | 预期 | 服务 |
|----|---|------|------|------|------|
| I-001 | P0 | 报错信息泄露 | 发送畸形请求触发500 | 不返回堆栈跟踪、SQL语句、文件路径 | Gateway |
| I-002 | P0 | 调试端点暴露 | GET /actuator/env, /actuator/configprops | 非localhost返回404 | Gateway |
| I-003 | P0 | Swagger端点暴露 | GET /swagger-ui.html, /v3/api-docs | 生产环境不暴露 | Gateway |
| I-004 | P1 | .git文件泄露 | GET /.git/config | 返回404 | Gateway |
| I-005 | P1 | .env文件泄露 | GET /.env | 返回404 | Gateway |
| I-006 | P1 | 备份文件泄露 | GET /backup.sql, /backup.zip | 返回404 | Gateway |
| I-007 | P1 | 目录遍历 | GET /api/../ | 返回404，不列出目录 | Gateway |
| I-008 | P0 | 响应头安全头 | 检查所有响应的Security Headers | X-Content-Type-Options, X-Frame-Options等存在 | Gateway |
| I-009 | P1 | Server头泄露 | 检查响应的Server头 | 不泄露服务器版本信息 | Gateway |
| I-010 | P1 | 错误码信息量 | 故意触发各种错误 | 错误消息不泄露内部实现细节 | 全部 |
| I-011 | P2 | 时间盲注 | 通过响应时间差异判断数据 | 无明显时间差异 | Station |
| I-012 | P2 | 布尔盲注 | 通过响应内容差异判断数据 | 无内容差异泄露 | Station |
| I-013 | P1 | 日志注入 | 在输入中注入换行符伪造日志 | 日志中特殊字符被转义 | 全部 |
| I-014 | P2 | Cookie安全属性 | 检查Cookie的HttpOnly/Secure/SameSite | 敏感Cookie有安全属性 | Identity |
| I-015 | P1 | 密码明文传输 | 抓包检查登录请求 | 密码不在URL中，body中是HTTPS加密的 | Identity |

### 3.4 加密与密钥 (10用例)

| ID | P | 描述 | 步骤 | 预期 | 服务 |
|----|---|------|------|------|------|
| K-001 | P0 | JWT密钥强度 | 检查JWT签名密钥 | 密钥长度≥256位 | Identity |
| K-002 | P0 | HTTPS强制 | HTTP请求是否重定向到HTTPS | 生产环境强制HTTPS | Gateway |
| K-003 | P1 | 密码哈希存储 | 检查数据库中密码字段 | 使用bcrypt/scrypt/PBKDF2哈希 | Identity |
| K-004 | P1 | 敏感数据加密 | 检查数据库中手机号等字段 | 脱敏或加密存储 | Identity |
| K-005 | P2 | API Key轮换 | 更换JWT密钥后旧Token | 旧Token立即失效 | Identity |
| K-006 | P1 | 随机数质量 | 检查Token生成的随机性 | 使用SecureRandom | Identity |
| K-007 | P2 | 密码复杂度 | 注册/修改密码时弱密码 | 拒绝弱密码（长度、复杂度） | Identity |
| K-008 | P2 | 会话超时 | Token过期时间设置 | 不超过24小时 | Identity |
| K-009 | P3 | HSTS头 | 检查Strict-Transport-Security头 | 生产环境存在 | Gateway |
| K-010 | P3 | 证书固定 | 检查TLS证书 | 有效证书，不过期 | Gateway |

---

## 四、功能与一致性测试 (65用例)

### 4.1 后端API全覆盖 (30用例)

| ID | P | 描述 | 步骤 | 预期 | 服务 |
|----|---|------|------|------|------|
| F-001 | P0 | 登录-API | POST /api/auth/login 正确凭据 | code=0, token+user对象 | Identity |
| F-002 | P0 | 登录-错误密码 | POST /api/auth/login 错误密码 | code!=0 | Identity |
| F-003 | P0 | 登录-字段验证 | POST /api/auth/login 空username | code=1001, 验证错误消息 | Identity |
| F-004 | P0 | 登出-API | POST /api/auth/logout | code=0 | Identity |
| F-005 | P0 | 用户信息-API | GET /api/auth/profile | code=0, 含username/roles | Identity |
| F-006 | P0 | 刷新Token-API | POST /api/auth/refresh | code=0, 新Token | Identity |
| F-007 | P0 | 用户列表-API | GET /api/users?page=1&size=10 | code=0, 分页数据 | Identity |
| F-008 | P0 | 用户详情-API | GET /api/users/1 | code=0, 用户信息 | Identity |
| F-009 | P0 | 站点列表-API | GET /api/stations?page=1&size=10 | code=0, 分页数据 | Station |
| F-010 | P0 | 站点详情-API | GET /api/stations/1 | code=0, 站点详情 | Station |
| F-011 | P0 | 创建站点-API | POST /api/stations 完整body | code=0, 返回创建的站点 | Station |
| F-012 | P0 | 更新站点-API | PUT /api/stations/1 更新字段 | code=0, 字段已更新 | Station |
| F-013 | P0 | 删除站点-API | DELETE /api/stations/999 (测试数据) | code=0 或 404 | Station |
| F-014 | P0 | 设备列表-API | GET /api/devices?stationId=1 | code=0, 设备列表 | Station |
| F-015 | P0 | 设备详情-API | GET /api/devices/1 | code=0, 设备信息 | Station |
| F-016 | P0 | 订单列表-API | GET /api/v1/orders?page=1&size=10 | code=0, 分页订单 | Order |
| F-017 | P0 | 订单详情-API | GET /api/orders/1 | code=0, 订单详情 | Order |
| F-018 | P0 | 订单状态筛选 | GET /api/v1/orders?status=PAID | 只返回PAID订单 | Order |
| F-019 | P0 | Dashboard概览-API | GET /api/dashboard/overview | code=0, 统计数据 | Order |
| F-020 | P0 | Dashboard趋势-API | GET /api/dashboard/trend?days=7 | code=0, 图表数据 | Order |
| F-021 | P0 | 财务概览-API | GET /api/finance/overview | code=0, 财务统计 | Order |
| F-022 | P0 | 交易明细-API | GET /api/finance/transactions | code=0, 交易列表 | Order |
| F-023 | P0 | 结算记录-API | GET /api/finance/settlement | code=0, 结算列表 | Order |
| F-024 | P0 | 告警列表-API | GET /api/v1/ops/alerts | code=0, 告警列表 | Order |
| F-025 | P0 | 工单列表-API | GET /api/v1/ops/workorders | code=0, 工单列表 | Order |
| F-026 | P0 | 巡检列表-API | GET /api/v1/ops/inspections | code=0, 巡检列表 | Order |
| F-027 | P0 | 启动充电-API | POST /api/v1/charging/start | code=0, orderId | Charging |
| F-028 | P0 | 充电状态-API | GET /api/v1/charging/{id}/status | code=0, 状态信息 | Charging |
| F-029 | P0 | 停止充电-API | POST /api/v1/charging/{id}/stop | code=0 | Charging |
| F-030 | P0 | 模拟器设备-API | GET /api/simulator/devices | code=0, 设备列表 | Simulator |

### 4.2 前端页面全覆盖 (20用例)

| ID | P | 描述 | 步骤 | 预期 | 服务 |
|----|---|------|------|------|------|
| FE-001 | P0 | admin-web登录页 | 访问 /login | 显示登录表单 | admin-web |
| FE-002 | P0 | admin-web仪表盘 | 登录后访问 /dashboard | 显示6个统计卡片+图表+表格 | admin-web |
| FE-003 | P0 | admin-web站点管理 | 访问 /station | 显示站点列表+搜索+操作按钮 | admin-web |
| FE-004 | P0 | admin-web设备管理 | 访问 /device | 显示设备列表 | admin-web |
| FE-005 | P0 | admin-web订单中心 | 访问 /order | 显示订单列表+分页 | admin-web |
| FE-006 | P0 | admin-web财务管理 | 访问 /finance | 显示财务数据 | admin-web |
| FE-007 | P0 | admin-web用户管理 | 访问 /user | 显示用户列表 | admin-web |
| FE-008 | P1 | admin-web告警中心 | 访问 /alert | 显示告警列表 | admin-web |
| FE-009 | P1 | admin-web运维管理 | 访问 /ops | 显示运维页面 | admin-web |
| FE-010 | P1 | admin-web营销中心 | 访问 /marketing | 显示营销页面 | admin-web |
| FE-011 | P1 | admin-web电价管理 | 访问 /pricing | 显示电价页面 | admin-web |
| FE-012 | P1 | admin-web数据分析 | 访问 /analytics | 显示分析页面 | admin-web |
| FE-013 | P1 | admin-web系统管理 | 访问 /system | 显示系统页面 | admin-web |
| FE-014 | P0 | simulator-web仪表盘 | 访问 / | 显示设备卡片+实时数据 | simulator-web |
| FE-015 | P1 | simulator-web设备页 | 访问设备管理页面 | 显示设备列表 | simulator-web |
| FE-016 | P1 | simulator-web场景页 | 访问场景管理页面 | 显示场景列表 | simulator-web |
| FE-017 | P0 | ops-app工作台 | 打开ops-app | 显示统计+快捷操作 | ops-app |
| FE-018 | P0 | user-miniapp首页 | 打开miniapp | 显示充电站+余额 | user-miniapp |
| FE-019 | P1 | user-miniapp找桩 | 点击找桩tab | 显示地图+站点 | user-miniapp |
| FE-020 | P1 | user-miniapp订单 | 点击订单tab | 显示订单列表 | user-miniapp |

### 4.3 前后端数据一致性 (15用例)

| ID | P | 描述 | 步骤 | 预期 | 服务 |
|----|---|------|------|------|------|
| C-001 | P0 | 站点数量一致 | GET /api/stations 返回total vs admin-web显示Total | 数字一致 | Station, admin-web |
| C-002 | P0 | 订单数量一致 | GET /api/v1/orders 返回total vs admin-web显示Total | 数字一致 | Order, admin-web |
| C-003 | P0 | 站点名称一致 | API返回的name vs 页面显示的name | 完全一致 | Station, admin-web |
| C-004 | P0 | 订单状态一致 | API返回的status vs 页面显示的状态标签 | 映射正确 | Order, admin-web |
| C-005 | P0 | 金额一致 | API返回的totalAmount vs 页面显示的金额 | 数值一致（考虑分→元转换） | Order, admin-web |
| C-006 | P1 | 分页数据一致 | 翻到第2页，API和页面数据一致 | 不重复不遗漏 | Order, admin-web |
| C-007 | P1 | 搜索结果一致 | 搜索"朝阳"，API和页面结果一致 | 数量和内容一致 | Station, admin-web |
| C-008 | P1 | 筛选结果一致 | 筛选status=PAID，API和页面一致 | 只显示PAID订单 | Order, admin-web |
| C-009 | P1 | 创建后刷新一致 | 创建站点后刷新页面 | 新站点出现在列表中 | Station, admin-web |
| C-010 | P1 | 修改后刷新一致 | 修改站点信息后刷新 | 信息已更新 | Station, admin-web |
| C-011 | P1 | 模拟器设备数一致 | API返回设备数 vs simulator-web卡片数 | 数量一致 | Simulator, simulator-web |
| C-012 | P1 | 模拟器状态一致 | API返回status vs 页面显示的状态标签 | 一致 | Simulator, simulator-web |
| C-013 | P2 | Dashboard统计一致 | API返回的overview vs 页面显示的数字 | 一致 | Order, admin-web |
| C-014 | P2 | 告警数量一致 | API返回的告警数 vs ops-app显示的数字 | 一致 | Order, ops-app |
| C-015 | P2 | 工单数量一致 | API返回的工单数 vs ops-app显示的数字 | 一致 | Order, ops-app |

---

## 五、性能与可靠性测试 (45用例)

### 5.1 响应时间 (15用例)

| ID | P | 描述 | 步骤 | 预期 | 服务 |
|----|---|------|------|------|------|
| PF-001 | P0 | 登录响应时间 | POST /api/auth/login | <500ms | Identity |
| PF-002 | P0 | 站点列表响应时间 | GET /api/stations | <1000ms | Station |
| PF-003 | P0 | 订单列表响应时间 | GET /api/v1/orders?page=1&size=20 | <1000ms | Order |
| PF-004 | P0 | Dashboard响应时间 | GET /api/dashboard/overview | <2000ms | Order |
| PF-005 | P0 | 充电启动响应时间 | POST /api/v1/charging/start | <500ms | Charging |
| PF-006 | P1 | 搜索响应时间 | GET /api/v1/stations?keyword=朝阳 | <500ms | Station |
| PF-007 | P1 | 大分页响应时间 | GET /api/v1/orders?page=1&size=100 | <2000ms | Order |
| PF-008 | P1 | 财务概览响应时间 | GET /api/finance/overview | <2000ms | Order |
| PF-009 | P1 | 模拟器设备列表响应 | GET /api/simulator/devices | <500ms | Simulator |
| PF-010 | P2 | 页面首屏加载时间 | 首次打开admin-web | <3s（含JS/CSS加载） | admin-web |
| PF-011 | P2 | 页面切换时间 | 点击菜单切换页面 | <500ms | admin-web |
| PF-012 | P2 | 图表渲染时间 | 仪表盘图表首次渲染 | <2s | admin-web |
| PF-013 | P2 | 表格渲染时间 | 订单列表20条数据渲染 | <500ms | admin-web |
| PF-014 | P1 | 首次冷启动时间 | 从零启动后端服务 | <60s | 全部 |
| PF-015 | P2 | 热启动时间 | 重启后端服务 | <30s | 全部 |

### 5.2 并发能力 (15用例)

| ID | P | 描述 | 步骤 | 预期 | 服务 |
|----|---|------|------|------|------|
| CF-001 | P0 | 10并发-站点查询 | 10并发GET /api/stations | 全部200，平均<2s | Station |
| CF-002 | P0 | 50并发-混合操作 | 50并发(读80%+写20%) | 全部成功，无数据损坏 | 全部 |
| CF-003 | P0 | 100并发-读操作 | 100并发GET | 限流生效，不崩溃 | Gateway |
| CF-004 | P1 | 200并发-登录 | 200并发POST /api/auth/login | 正确处理，不重复session | Identity |
| CF-005 | P1 | 50并发-充电启动 | 50并发POST /api/v1/charging/start | 不超卖，每个会话独立 | Charging |
| CF-006 | P1 | 并发读写-同一资源 | 并发GET+PUT同一站点 | 读返回一致数据，写成功 | Station |
| CF-007 | P1 | 并发写-同一订单 | 并发PUT同一订单状态 | 乐观锁生效，一个成功一个失败 | Order |
| CF-008 | P2 | 长时间压力测试 | 10并发持续5分钟 | 无内存泄漏，无连接泄漏 | 全部 |
| CF-09 | P2 | 突发流量 | 瞬间100请求→静默10秒→再100请求 | 两次都正常处理 | Gateway |
| CF-010 | P1 | 数据库连接池 | 并发50个数据库操作 | 连接池不溢出 | Station |
| CF-011 | P1 | Redis连接池 | 并发100个缓存操作 | 连接池不溢出 | 全部 |
| CF-012 | P2 | Kafka消息积压 | 快速发送100条消息 | 消费者正常消费，不丢失 | Order |
| CF-013 | P2 | WebSocket并发 | 10个并发WebSocket连接 | 全部连接成功 | Simulator |
| CF-014 | P2 | 分页并发 | 并发请求不同页码 | 各页数据不重复不遗漏 | Order |
| CF-015 | P3 | 文件上传并发 | 10个并发文件上传 | 全部成功（如有上传功能） | MinIO |

### 5.3 故障恢复 (15用例)

| ID | P | 描述 | 步骤 | 预期 | 服务 |
|----|---|------|------|------|------|
| FR-001 | P0 | Redis不可用 | 停止Redis容器后发请求 | 降级处理，不500（或明确错误） | 全部 |
| FR-002 | P0 | PostgreSQL不可用 | 停止PG容器后发请求 | 返回503，不崩溃 | 全部 |
| FR-003 | P0 | Kafka不可用 | 停止Kafka后发充电请求 | 充电可启动，消息发送失败有重试 | Charging |
| FR-004 | P1 | 服务重启后恢复 | 重启station服务后发请求 | 自动注册到Nacos，请求正常 | Station |
| FR-005 | P1 | 数据库重连 | PG短暂断开后恢复 | 连接池自动重连 | Station |
| FR-006 | P1 | Redis重连 | Redis短暂断开后恢复 | 缓存自动重建 | 全部 |
| FR-007 | P1 | Gateway服务发现 | 重启identity服务 | Gateway自动发现新实例 | Gateway |
| FR-008 | P2 | Nacos不可用 | 停止Nacos后发请求 | 已注册服务仍可用（本地缓存） | Gateway |
| FR-009 | P2 | MinIO不可用 | 停止MinIO后上传文件 | 返回明确错误，不崩溃 | MinIO |
| FR-010 | P1 | 磁盘空间不足 | 模拟磁盘满 | 日志不写入但服务不崩溃 | 全部 |
| FR-011 | P2 | CPU高负载 | 模拟CPU 90%+ | 服务降级但不崩溃 | 全部 |
| FR-012 | P2 | 内存高占用 | 模拟内存90%+ | GC正常，不OOM | 全部 |
| FR-013 | P1 | 优雅停机 | SIGTERM后发新请求 | 拒绝新请求，完成在处理的请求 | 全部 |
| FR-014 | P2 | 数据库事务回滚 | 故意触发事务失败 | 数据一致性，无脏数据 | Order |
| FR-015 | P2 | Kafka消费失败重试 | 消费者处理失败 | 自动重试，不丢失消息 | Order |

---

## 六、体验(UX)测试 (45用例)

### 6.1 视觉一致性 (15用例)

| ID | P | 描述 | 步骤 | 预期 | 服务 |
|----|---|------|------|------|------|
| UX-001 | P1 | 品牌色一致 | 检查所有页面主色调 | admin: #1677FF, miniapp: #07C160 | 全部前端 |
| UX-002 | P1 | 背景色一致 | 检查所有页面背景 | admin: #F0F2F5 | admin-web |
| UX-003 | P1 | 字体一致 | 检查正文字体 | PingFang SC / Microsoft YaHei | admin-web |
| UX-004 | P1 | 数字字体 | 检查金额/电量数字 | DIN Alternate 或等宽字体 | admin-web |
| UX-005 | P1 | 间距一致性 | 检查元素间距 | 基于8px网格 | admin-web |
| UX-006 | P1 | 按钮样式一致 | 检查所有按钮 | 主按钮/次按钮/文字按钮样式统一 | admin-web |
| UX-007 | P2 | 暗色主题 | 切换到暗色模式（如有） | 所有元素正确适配 | admin-web |
| UX-008 | P1 | 表格样式一致 | 检查所有表格 | 表头/行高/斑马纹一致 | admin-web |
| UX-009 | P1 | 表单样式一致 | 检查所有表单 | 输入框/标签/验证提示一致 | admin-web |
| UX-010 | P2 | 图标一致性 | 检查所有图标 | 使用统一图标库（Element Plus Icons） | admin-web |
| UX-011 | P2 | 动画一致性 | 检查页面切换动画 | 平滑过渡，无突变 | admin-web |
| UX-012 | P1 | 状态颜色一致 | 检查所有状态标签 | Success:#52C41A Warning:#FAAD14 Error:#FF4D4F | admin-web |
| UX-013 | P2 | 空状态设计 | 检查无数据页面 | 显示空状态插图+提示文字 | admin-web |
| UX-014 | P2 | 加载状态设计 | 检查loading状态 | 使用骨架屏或loading动画 | admin-web |
| UX-015 | P2 | 错误状态设计 | 检查错误页面 | 404/500页面有设计感 | admin-web |

### 6.2 交互反馈 (15用例)

| ID | P | 描述 | 步骤 | 预期 | 服务 |
|----|---|------|------|------|------|
| IX-001 | P0 | 表单验证反馈 | 提交空表单 | 字段变红+错误提示文字 | admin-web |
| IX-002 | P0 | 成功操作反馈 | 创建站点成功 | 顶部绿色消息"创建成功" | admin-web |
| IX-003 | P0 | 失败操作反馈 | 创建站点失败 | 顶部红色消息+具体错误 | admin-web |
| IX-004 | P1 | 删除确认 | 点击删除按钮 | 弹出确认对话框 | admin-web |
| IX-005 | P1 | 提交loading | 点击提交按钮 | 按钮显示loading，防止重复点击 | admin-web |
| IX-006 | P1 | 表单实时验证 | 输入框失焦时验证 | 即时显示验证结果 | admin-web |
| IX-007 | P1 | 搜索loading | 在搜索框输入 | 显示搜索loading指示器 | admin-web |
| IX-008 | P2 | 操作撤销 | 删除后显示"撤销"按钮 | 5秒内可撤销 | admin-web |
| IX-009 | P1 | 键盘导航 | Tab键切换表单字段 | 焦点正确移动 | admin-web |
| IX-010 | P1 | Enter提交 | 在表单中按Enter | 提交表单 | admin-web |
| IX-011 | P1 | Esc关闭弹窗 | 按Esc关闭对话框 | 弹窗关闭 | admin-web |
| IX-012 | P2 | 复制成功提示 | 点击复制按钮 | 显示"已复制"提示 | admin-web |
| IX-013 | P2 | Tooltip | 长文本截断时hover | 显示完整内容的tooltip | admin-web |
| IX-014 | P2 | 进度条 | 上传文件时 | 显示进度条 | admin-web |
| IX-015 | P1 | 网络错误提示 | 断网后操作 | 显示"网络错误"提示，不白屏 | admin-web |

### 6.3 错误提示友好度 (15用例)

| ID | P | 描述 | 步骤 | 预期 | 服务 |
|----|---|------|------|------|------|
| ER-001 | P0 | 404页面 | 访问不存在的路由 | 显示友好404页面，有返回首页按钮 | admin-web |
| ER-002 | P0 | 401提示 | Token过期后操作 | 提示"登录已过期，请重新登录" | admin-web |
| ER-003 | P0 | 403提示 | 无权限访问页面 | 显示"无权限"提示 | admin-web |
| ER-004 | P1 | 500提示 | 后端返回500 | 显示"服务器错误，请稍后重试" | admin-web |
| ER-005 | P1 | 网络超时提示 | 请求超时 | 显示"请求超时，请检查网络" | admin-web |
| ER-006 | P1 | 表单字段错误 | 每个字段的验证错误 | 显示具体错误，如"手机号格式不正确" | admin-web |
| ER-007 | P1 | 业务错误提示 | 后端返回业务错误码 | 显示后端返回的错误消息 | admin-web |
| ER-008 | P2 | 错误消息不堆叠 | 连续触发多个错误 | 最多显示3条，旧的自动消失 | admin-web |
| ER-009 | P1 | 中文错误消息 | 所有错误提示 | 中文显示，不出现英文技术错误 | admin-web |
| ER-010 | P1 | 错误不泄露技术细节 | 用户看到的错误 | 不显示堆栈跟踪、SQL、字段名 | admin-web |
| ER-011 | P2 | 操作失败重试 | POST失败后 | 提供"重试"按钮 | admin-web |
| ER-012 | P2 | 数据加载失败 | 列表加载失败 | 显示"加载失败"+重试按钮 | admin-web |
| ER-013 | P2 | 图表加载失败 | ECharts加载失败 | 显示占位图，不空白 | admin-web |
| ER-014 | P2 | 图片加载失败 | 头像/图片404 | 显示默认头像 | admin-web |
| ER-015 | P3 | 断网后缓存页面 | 断网后刷新页面 | 显示离线提示或缓存内容 | admin-web |

---

## 七、全场景与极端环境测试 (50用例)

### 7.1 边界值测试 (20用例)

| ID | P | 描述 | 步骤 | 预期 | 服务 |
|----|---|------|------|------|------|
| BV-001 | P1 | 分页-page=0 | GET /api/v1/orders?page=0 | 返回page=1或错误 | Order |
| BV-002 | P1 | 分页-page=-1 | GET /api/v1/orders?page=-1 | 返回400或page=1 | Order |
| BV-003 | P1 | 分页-size=0 | GET /api/v1/orders?size=0 | 返回默认size或错误 | Order |
| BV-004 | P1 | 分页-size=10000 | GET /api/v1/orders?size=10000 | 返回最大size（如100） | Order |
| BV-005 | P1 | 分页-超出范围 | GET /api/v1/orders?page=99999 | 返回空列表，不错误 | Order |
| BV-006 | P1 | 字符串长度-0 | POST {"name":""} | 验证器拒绝 | Station |
| BV-007 | P1 | 字符串长度-最大 | POST {"name":"A"*128} | 接受（如果max=128） | Station |
| BV-008 | P1 | 字符串长度-超最大 | POST {"name":"A"*129} | 验证器拒绝 | Station |
| BV-009 | P1 | 数值-最小 | POST {"price":0} | 接受 | Station |
| BV-010 | P1 | 数值-负数 | POST {"price":-1} | 拒绝或修正 | Station |
| BV-011 | P1 | 数值-最大精度 | POST {"price":1.99999} | 按精度截断 | Station |
| BV-012 | P1 | 日期-最小 | POST {"date":"1970-01-01"} | 接受或拒绝 | Order |
| BV-013 | P1 | 日期-最大 | POST {"date":"2099-12-31"} | 接受或拒绝 | Order |
| BV-014 | P2 | 日期-无效 | POST {"date":"2026-02-30"} | 返回400 | Order |
| BV-015 | P2 | 日期-格式错误 | POST {"date":"not-a-date"} | 返回400 | Order |
| BV-016 | P1 | 经度边界 | POST {"longitude":181} | 验证器拒绝（-180~180） | Station |
| BV-017 | P1 | 纬度边界 | POST {"latitude":91} | 验证器拒绝（-90~90） | Station |
| BV-018 | P1 | 枚举值-无效 | POST {"type":"INVALID"} | 验证器拒绝 | Station |
| BV-019 | P2 | 数组-空 | POST {"tags":[]} | 接受或拒绝 | Station |
| BV-020 | P2 | 数组-单元素 | POST {"tags":["a"]} | 接受 | Station |

### 7.2 异常数据场景 (15用例)

| ID | P | 描述 | 步骤 | 预期 | 服务 |
|----|---|------|------|------|------|
| ED-001 | P1 | 订单-电量为null | 查询status=CHARGING的订单 | 电量显示"充电中"或"-"，不显示null | admin-web |
| ED-002 | P1 | 订单-金额为0 | 查询未结算订单 | 金额显示¥0.00，不显示undefined | admin-web |
| ED-003 | P1 | 订单-开始时间为null | 查询CREATED状态订单 | 时间显示"-"，不显示null | admin-web |
| ED-004 | P1 | 站点-设备数为0 | 查询无设备的站点 | 设备列显示0，不显示null | admin-web |
| ED-005 | P1 | 用户-头像为空 | 查询无头像的用户 | 显示默认头像，不显示broken img | admin-web |
| ED-006 | P1 | 告警-处理结果为空 | 查询未处理告警 | 处理结果显示"待处理"，不显示null | admin-web |
| ED-007 | P1 | 工单-指派人为null | 查询待分配工单 | 指派人显示"待分配"，不显示null | admin-web |
| ED-008 | P2 | 站点-联系人电话脱敏 | 查看站点列表 | 电话显示138****0001 | admin-web |
| ED-009 | P2 | 用户-手机号脱敏 | 查看用户列表 | 手机号显示138****8000 | admin-web |
| ED-010 | P1 | 空列表-订单 | 无订单时访问订单页 | 显示"暂无订单"提示 | admin-web |
| ED-011 | P1 | 空列表-告警 | 无告警时访问告警页 | 显示"暂无告警"提示 | ops-app |
| ED-012 | P2 | 超长站点名称 | 站点名100个字符 | 表格中截断+tooltip | admin-web |
| ED-013 | P2 | 超长地址 | 地址200个字符 | 截断+tooltip | admin-web |
| ED-014 | P2 | 特殊字符名称 | 站点名含/、\、"、' | 正确显示，不转义错误 | admin-web |
| ED-015 | P1 | 并发修改同一资源 | 两个用户同时编辑同一站点 | 后提交者收到冲突提示 | Station |

### 7.3 网络异常场景 (15用例)

| ID | P | 描述 | 步骤 | 预期 | 服务 |
|----|---|------|------|------|------|
| NE-001 | P0 | 后端完全不可用 | 所有后端服务停止 | 前端显示"服务不可用" | 全部前端 |
| NE-002 | P1 | 请求超时 | 设置请求超时5秒 | 超时后显示错误提示 | admin-web |
| NE-003 | P1 | 慢网络-3G | 模拟3G网络(750kbps) | 页面可加载，有loading状态 | admin-web |
| NE-004 | P2 | 网络中断-恢复 | 请求过程中断网→恢复 | 自动重试或提示用户重试 | admin-web |
| NE-005 | P2 | DNS解析失败 | 无法解析后端域名 | 显示"无法连接服务器" | admin-web |
| NE-006 | P1 | 间歇性502 | 后端偶尔返回502 | 自动重试，显示loading | admin-web |
| NE-007 | P2 | 响应截断 | 响应body被截断 | 检测到JSON解析错误，提示重试 | admin-web |
| NE-008 | P1 | WebSocket断连 | 模拟WebSocket断开 | 自动重连，显示"连接断开"状态 | simulator-web |
| NE-009 | P2 | SSE断连 | Server-Sent Events断开 | 自动重连 | admin-web |
| NE-010 | P1 | 上传中断 | 上传文件时网络中断 | 显示上传失败，提供重试 | admin-web |
| NE-011 | P2 | 双重请求 | 网络慢时用户重复点击 | 去重，只发一次请求 | admin-web |
| NE-012 | P2 | 请求顺序错乱 | 快速连续发A→B请求，B先返回 | 按正确顺序处理 | admin-web |
| NE-013 | P2 | CDN资源加载失败 | JS/CSS加载404 | 本地fallback或提示刷新 | admin-web |
| NE-014 | P3 | 代理超时 | 反向代理超时 | 返回504，前端显示错误 | Gateway |
| NE-015 | P3 | 证书错误 | TLS证书无效 | 浏览器警告（开发环境可忽略） | Gateway |

---

## 八、功能安全与网络安全测试 (45用例)

### 8.1 OCPP协议安全 (15用例)

| ID | P | 描述 | 步骤 | 预期 | 服务 |
|----|---|------|------|------|------|
| OC-001 | P0 | OCPP消息验证 | 发送畸形OCPP消息 | 不崩溃，返回CallError | Simulator |
| OC-002 | P0 | OCPP未知Action | 发送不存在的Action | 返回NotImplemented错误 | Simulator |
| OC-003 | P0 | OCPP消息过大 | 发送10MB的OCPP消息 | 连接关闭，不OOM | Simulator |
| OC-004 | P1 | OCPP认证绕过 | 不带ChargePointId连接 | 连接拒绝 | Simulator |
| OC-005 | P1 | OCPP重放攻击 | 重放旧的OCPP消息 | 检测到重复，忽略 | Simulator |
| OC-006 | P1 | OCPP并发连接 | 同一ChargePointId多次连接 | 只允许一个连接 | Simulator |
| OC-007 | P1 | OCPP心跳超时 | ChargePoint停止心跳 | 标记为离线 | Simulator |
| OC-008 | P2 | OCPP版本兼容 | 发送OCPP 1.6和2.0消息 | 正确处理或拒绝不兼容版本 | Simulator |
| OC-009 | P2 | OCPP消息顺序 | 发送乱序的OCPP消息 | 正确处理或丢弃 | Simulator |
| OC-010 | P1 | 充电状态机-非法转换 | 在STOPPED状态发送StartTransaction | 拒绝，返回错误 | Charging |
| OC-011 | P1 | 充电状态机-重复启动 | 已充电时再次启动 | 拒绝，返回"已在充电" | Charging |
| OC-012 | P1 | 充电状态机-停止未启动 | 未启动时停止 | 返回"未在充电" | Charging |
| OC-013 | P2 | OCPP MeterValues | 发送畸形MeterValues | 正确解析或忽略 | Simulator |
| OC-014 | P2 | OCPP异常断连 | 充电中WebSocket断开 | 标记设备离线，订单状态更新 | Simulator |
| OC-015 | P2 | OCPP消息超时 | 发送Call后不等待Result | 超时后释放资源 | Simulator |

### 8.2 数据安全 (15用例)

| ID | P | 描述 | 步骤 | 预期 | 服务 |
|----|---|------|------|------|------|
| DS-001 | P0 | 密码不返回 | GET /api/auth/profile | 密码字段不在响应中 | Identity |
| DS-002 | P0 | 密码不日志 | 查看应用日志 | 密码不出现在日志中 | Identity |
| DS-003 | P1 | 手机号脱敏 | GET /api/users列表 | 手机号显示138****8000 | Identity |
| DS-004 | P1 | 审计日志-登录 | 用户登录 | 记录登录时间/IP/用户名 | Identity |
| DS-005 | P1 | 审计日志-删除 | 删除站点 | 记录操作人/时间/删除的数据 | Station |
| DS-006 | P1 | 审计日志-修改 | 修改用户状态 | 记录修改前后值 | Identity |
| DS-007 | P2 | 数据备份 | 检查数据库备份策略 | 定期备份可恢复 | PostgreSQL |
| DS-008 | P1 | 敏感配置不泄露 | GET /actuator/env | 返回404或空 | Gateway |
| DS-009 | P1 | 环境变量不泄露 | 检查前端代码 | 不含API密钥/密码 | 全部前端 |
| DS-010 | P1 | Source Map不泄露 | GET /assets/*.js.map | 生产环境不暴露 | admin-web |
| DS-011 | P2 | 数据删除不可恢复 | 软删除数据 | 使用deleted标记，不物理删除 | 全部 |
| DS-012 | P2 | 导出数据权限 | 导出订单数据 | 需要权限验证 | Order |
| DS-013 | P2 | 批量操作限制 | 批量删除1000条 | 限制批量大小 | Station |
| DS-014 | P2 | 文件类型验证 | 上传非图片文件作为头像 | 拒绝，只允许图片类型 | MinIO |
| DS-015 | P2 | 文件大小限制 | 上传100MB文件 | 限制最大文件大小 | MinIO |

### 8.3 审计与合规 (15用例)

| ID | P | 描述 | 步骤 | 预期 | 服务 |
|----|---|------|------|------|------|
| AC-001 | P1 | 操作日志完整性 | 执行CRUD操作 | 所有写操作有日志 | 全部 |
| AC-002 | P1 | 日志格式规范 | 检查日志格式 | JSON格式，含traceId/timestamp/level | 全部 |
| AC-003 | P1 | 链路追踪 | 发起一个请求 | traceId贯穿Gateway→Service→DB | 全部 |
| AC-004 | P2 | 日志级别 | ERROR/WARN/INFO/DEBUG | 正确使用各级别 | 全部 |
| AC-005 | P1 | 错误日志内容 | 触发一个500错误 | 日志含完整堆栈+请求上下文 | 全部 |
| AC-006 | P2 | 日志轮转 | 检查日志文件策略 | 按大小/日期轮转，不占满磁盘 | 全部 |
| AC-007 | P1 | 数据保留策略 | 检查数据保留期 | 过期数据归档或删除 | Order |
| AC-008 | P2 | GDPR-数据导出 | 用户请求导出数据 | 支持导出个人数据 | Identity |
| AC-009 | P2 | GDPR-数据删除 | 用户请求删除账号 | 支持删除个人数据 | Identity |
| AC-010 | P2 | 并发审计 | 并发操作的审计日志 | 每个操作独立记录 | 全部 |
| AC-011 | P2 | 时间同步 | 检查服务器时间 | 所有服务时间同步(NTP) | 全部 |
| AC-012 | P2 | 时间戳格式 | 检查API时间字段 | ISO 8601格式，含时区 | 全部 |
| AC-013 | P3 | 多语言日志 | 中文/英文操作的日志 | 正确编码，不乱码 | 全部 |
| AC-014 | P3 | 日志脱敏 | 日志中的敏感字段 | 密码/Token不记录 | 全部 |
| AC-015 | P2 | 指标暴露 | GET /actuator/prometheus | Prometheus指标正确 | 全部 |

---

## 九、智能化与体验测试 (35用例)

### 9.1 智能推荐与分析 (15用例)

| ID | P | 描述 | 步骤 | 预期 | 服务 |
|----|---|------|------|------|------|
| SM-001 | P1 | Dashboard趋势准确性 | 对比7天趋势数据与订单数据 | 趋势图数据与实际订单一致 | Order |
| SM-002 | P1 | 营收统计准确性 | 对比overview营收与订单金额之和 | 数值一致（考虑分→元） | Order |
| SM-003 | P1 | 充电量统计准确性 | 对比overview电量与订单电量之和 | 数值一致 | Order |
| SM-004 | P1 | 设备在线率准确性 | 对比在线设备数/总设备数 | 比率正确 | Station |
| SM-005 | P1 | 设备利用率准确性 | 对比充电设备数/总设备数 | 比率正确 | Station |
| SM-006 | P2 | 站点营收排行 | 查看Top5站点排行 | 按营收降序排列 | Order |
| SM-007 | P2 | 订单状态分布 | 查看状态分布统计 | 各状态数量正确 | Order |
| SM-008 | P2 | 告警趋势分析 | 查看告警趋势 | 时间轴和数量正确 | Order |
| SM-009 | P2 | 用户充电习惯 | 查看用户充电记录 | 时间/频率/电量统计正确 | Order |
| SM-010 | P2 | 实时充电功率 | simulator-web实时功率 | 数据实时更新，数值合理 | Simulator |
| SM-011 | P2 | SOC变化曲线 | simulator-web SOC趋势 | 曲线平滑上升 | Simulator |
| SM-012 | P2 | 温度监控 | simulator-web温度数据 | 数值在合理范围(20-80°C) | Simulator |
| SM-013 | P3 | 异常检测 | 设备突然离线 | 触发告警 | Simulator |
| SM-014 | P3 | 预测性维护 | 设备温度持续升高 | 提前预警 | Simulator |
| SM-015 | P3 | 能耗分析 | 分析充电效率 | 效率数值合理(85-95%) | Order |

### 9.2 实时推送 (10用例)

| ID | P | 描述 | 步骤 | 预期 | 服务 |
|----|---|------|------|------|------|
| RT-001 | P1 | 充电状态实时更新 | 启动充电后观察simulator-web | SOC/功率实时更新 | Simulator |
| RT-002 | P1 | 设备状态实时更新 | 设备上下线 | simulator-web立即更新状态 | Simulator |
| RT-003 | P1 | OCPP事件实时显示 | 设备发送OCPP消息 | simulator-web事件流实时显示 | Simulator |
| RT-004 | P1 | 告警实时推送 | 触发新告警 | ops-app实时显示新告警 | Order |
| RT-005 | P2 | 订单状态推送 | 订单状态变化 | admin-web表格更新 | Order |
| RT-006 | P2 | Kafka消息消费 | 充电停止→订单结算 | 自动触发结算，无延迟 | Order |
| RT-007 | P2 | 多设备同步 | 同时监控多个设备 | 各设备数据独立更新 | Simulator |
| RT-008 | P2 | 图表实时更新 | 实时数据到达 | ECharts图表平滑更新 | simulator-web |
| RT-009 | P3 | 推送丢失处理 | WebSocket断连后恢复 | 补发断连期间的数据 | Simulator |
| RT-010 | P3 | 推送频率控制 | 高频数据(每秒10次) | 前端正确处理，不卡顿 | Simulator |

### 9.3 数据可视化 (10用例)

| ID | P | 描述 | 步骤 | 预期 | 服务 |
|----|---|---|------|------|------|
| DV-001 | P1 | 营收趋势图 | 查看仪表盘营收趋势 | ECharts折线图正确渲染 | admin-web |
| DV-002 | P1 | 站点排行图 | 查看站点营收Top5 | 柱状图或表格正确 | admin-web |
| DV-003 | P1 | 订单状态饼图 | 查看订单状态分布 | 饼图正确，颜色区分 | admin-web |
| DV-004 | P1 | 设备状态分布图 | simulator-web设备分布 | 饼图或环形图正确 | simulator-web |
| DV-005 | P1 | 实时功率曲线 | simulator-web功率趋势 | 折线图实时更新 | simulator-web |
| DV-006 | P2 | SOC趋势曲线 | simulator-web SOC趋势 | 折线图平滑 | simulator-web |
| DV-007 | P2 | 温度趋势曲线 | simulator-web温度趋势 | 折线图+警戒线 | simulator-web |
| DV-008 | P2 | 地图充电站标记 | user-miniapp找桩地图 | 地图上显示站点标记 | user-miniapp |
| DV-009 | P2 | 地图聚合 | 大量站点标记 | 近距离站点聚合显示 | user-miniapp |
| DV-010 | P3 | 3D可视化 | 设备3D模型（如有） | 正确渲染 | simulator-web |

---

## 十、功能完整性测试 (55用例)

### 10.1 全业务流程 (20用例)

| ID | P | 描述 | 步骤 | 预期 | 服务 |
|----|---|------|------|------|------|
| BP-001 | P0 | 充电全流程 | 登录→找桩→开始充电→查看SOC→停止充电→查看结算→支付 | 全流程无错误，状态正确 | 全部 |
| BP-002 | P0 | 订单状态机 | CREATED→CHARGING→STOPPED→SETTLING→SETTLED→PAYING→PAID | 每个状态转换正确 | Order |
| BP-003 | P0 | 退款流程 | PAID→REFUNDING→REFUNDED | 退款状态正确 | Order |
| BP-004 | P0 | 异常订单流程 | CHARGING→ABNORMAL | 异常中断状态正确 | Order |
| BP-005 | P0 | 取消订单流程 | CREATED→CANCELLED | 取消状态正确 | Order |
| BP-006 | P0 | 告警全流程 | 设备异常→产生告警→查看→处理→确认 | 告警状态正确 | Order |
| BP-007 | P0 | 工单全流程 | 告警→创建工单→分配→接单→完成 | 工单状态正确 | Order |
| BP-008 | P0 | 巡检全流程 | 创建巡检任务→执行→提交结果 | 巡检状态正确 | Order |
| BP-009 | P1 | 站点管理全流程 | 创建→编辑→启用→停用→删除 | 站点状态正确 | Station |
| BP-010 | P1 | 设备管理全流程 | 入库→安装→上线→维护→退役→报废 | 设备状态正确 | Station |
| BP-011 | P1 | 用户管理全流程 | 创建→启用→禁用→删除 | 用户状态正确 | Identity |
| BP-012 | P1 | 多租户隔离 | 租户A操作不影响租户B | 数据完全隔离 | 全部 |
| BP-013 | P1 | Kafka事件链 | 充电停止→Kafka→订单结算→财务统计 | 事件链完整 | Order |
| BP-014 | P1 | OCPP模拟全流程 | Boot→Status→StartTransaction→MeterValues→StopTransaction | OCPP消息正确处理 | Simulator |
| BP-015 | P2 | 场景模拟执行 | 创建场景→执行→监控→停止 | 场景执行正确 | Simulator |
| BP-016 | P2 | 财务结算全流程 | 订单完成→计算电费+服务费→生成结算单 | 金额计算正确 | Order |
| BP-017 | P2 | 电价管理 | 修改电价→新订单使用新电价 | 价格正确应用 | Station |
| BP-018 | P2 | 优惠券使用 | 使用优惠券→订单金额减少 | 折扣正确 | Order |
| BP-019 | P2 | 充电桩复位 | 远程复位充电桩 | 设备重启 | Simulator |
| BP-020 | P2 | 充电枪解锁 | 远程解锁充电枪 | 枪锁解除 | Simulator |

### 10.2 全状态机验证 (15用例)

| ID | P | 描述 | 步骤 | 预期 | 服务 |
|----|---|------|------|------|------|
| SM-001 | P0 | 订单-CREATED→CHARGING | 启动充电 | 状态变为CHARGING | Order |
| SM-002 | P0 | 订单-CHARGING→STOPPING | 停止充电 | 状态变为STOPPING | Order |
| SM-003 | P0 | 订单-STOPPING→STOPPED | 停止完成 | 状态变为STOPPED | Order |
| SM-004 | P0 | 订单-STOPPED→SETTLING | 自动结算 | 状态变为SETTLING | Order |
| SM-005 | P0 | 订单-SETTLING→SETTLED | 结算完成 | 状态变为SETTLED | Order |
| SM-006 | P0 | 订单-SETTLED→PAYING | 发起支付 | 状态变为PAYING | Order |
| SM-007 | P0 | 订单-PAYING→PAID | 支付完成 | 状态变为PAID | Order |
| SM-008 | P1 | 订单-非法转换验证 | 在CREATED状态直接stop | 拒绝，返回错误 | Order |
| SM-009 | P1 | 告警-pending→resolved | 处理告警 | 状态变为resolved | Order |
| SM-010 | P1 | 告警-pending→ignored | 忽略告警 | 状态变为ignored | Order |
| SM-011 | P1 | 工单-pending→accepted | 接单 | 状态变为accepted | Order |
| SM-012 | P1 | 工单-accepted→completed | 完成工单 | 状态变为completed | Order |
| SM-013 | P1 | 设备-ONLINE→OFFLINE | 设备断连 | 状态变为OFFLINE | Station |
| SM-014 | P1 | 设备-OFFLINE→ONLINE | 设备上线 | 状态变为ONLINE | Station |
| SM-015 | P2 | 设备-全生命周期 | PURCHASED→IN_WAREHOUSE→INSTALLING→ONLINE→MAINTENANCE→RETIRED→SCRAPPED | 每个状态正确 | Station |

### 10.3 全API端点验证 (20用例)

| ID | P | 描述 | 端点 | 预期 | 服务 |
|----|---|------|------|------|------|
| EP-001 | P0 | POST /api/auth/login | 认证 | code=0 | Identity |
| EP-002 | P0 | POST /api/auth/logout | 登出 | code=0 | Identity |
| EP-003 | P0 | GET /api/auth/profile | 用户信息 | code=0 | Identity |
| EP-004 | P0 | POST /api/auth/refresh | 刷新Token | code=0 | Identity |
| EP-005 | P0 | GET /api/users | 用户列表 | code=0+分页 | Identity |
| EP-006 | P0 | GET /api/users/{id} | 用户详情 | code=0 | Identity |
| EP-007 | P0 | PUT /api/users/{id}/status | 修改状态 | code=0 | Identity |
| EP-008 | P0 | POST /api/v1/ops/auth/login | 运维登录 | code=0 | Identity |
| EP-009 | P0 | GET /api/v1/ops/user/profile | 运维信息 | code=0 | Identity |
| EP-010 | P0 | GET /api/stations | 站点列表 | code=0+分页 | Station |
| EP-011 | P0 | GET /api/stations/{id} | 站点详情 | code=0 | Station |
| EP-012 | P0 | POST /api/stations | 创建站点 | code=0 | Station |
| EP-013 | P0 | PUT /api/stations/{id} | 更新站点 | code=0 | Station |
| EP-014 | P0 | DELETE /api/stations/{id} | 删除站点 | code=0 | Station |
| EP-015 | P0 | GET /api/devices | 设备列表 | code=0 | Station |
| EP-016 | P0 | GET /api/devices/{id} | 设备详情 | code=0 | Station |
| EP-017 | P0 | GET /api/v1/stations | 用户站点 | code=0 | Station |
| EP-018 | P0 | GET /api/v1/ops/stations | 运维站点 | code=0 | Station |
| EP-019 | P0 | GET /api/v1/orders | 订单列表 | code=0+分页 | Order |
| EP-020 | P0 | GET /api/orders/{id} | 订单详情 | code=0 | Order |

---

## 附录

### 用例统计

| 维度 | 用例数 | P0 | P1 | P2 | P3 |
|------|--------|----|----|----|----|
| 一、拟人化测试 | 55 | 3 | 20 | 30 | 2 |
| 二、恶劣环境测试 | 55 | 15 | 20 | 18 | 2 |
| 三、API安全测试 | 55 | 15 | 25 | 12 | 3 |
| 四、功能与一致性 | 65 | 40 | 20 | 5 | 0 |
| 五、性能与可靠性 | 45 | 10 | 20 | 14 | 1 |
| 六、体验(UX)测试 | 45 | 5 | 25 | 14 | 1 |
| 七、极端环境测试 | 50 | 5 | 25 | 18 | 2 |
| 八、功能安全测试 | 45 | 8 | 22 | 14 | 1 |
| 九、智能化测试 | 35 | 0 | 15 | 14 | 6 |
| 十、功能完整性 | 55 | 25 | 22 | 8 | 0 |
| **总计** | **505** | **126** | **214** | **147** | **18** |

### 涉及服务覆盖

| 服务 | 覆盖用例数 |
|------|-----------|
| Gateway | 85 |
| Identity | 65 |
| Station | 70 |
| Order | 80 |
| Charging | 35 |
| Simulator | 50 |
| admin-web | 90 |
| ops-app | 25 |
| user-miniapp | 25 |
| simulator-web | 30 |

