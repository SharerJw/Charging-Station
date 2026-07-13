# 🔌 充电平台 - 产品模拟器（Web）深度细化提示词

针对**产品模拟器（Web）**，我将其拆分为 **6个核心模块** 进行深度细化。这些提示词包含了极其详尽的 UI 组件、业务逻辑、OCPP 协议细节和交互状态，可直接输入给 Cursor、v0、Bolt.new 等 AI 编码工具生成高质量代码。

---

## 提示词 1：全局 Layout 与虚拟设备资产管理中心

> **定位**：模拟器的整体框架骨架，以及虚拟充电桩设备（Virtual EVSE）的创建、编辑、分组和生命周期管理。

```text
请生成一个“充电桩产品模拟器”的 Web 端全局 Layout 及“设备资产管理”页面。
技术栈：Vue 3 (Composition API) + TypeScript + Element Plus + Pinia + TailwindCSS。
UI风格：深色极客风（Dark Tech），背景色 #0B1120，卡片背景 #111827，边框 #1F2937，主色调 科技蓝(#3B82F6)，辅以 荧光绿(#10B981) 表示在线/正常，警示红(#EF4444) 表示故障。

【全局 Layout 设计】
1. 左侧导航栏（可折叠至仅显示图标，宽度 220px/64px）：
   - 顶部：动态 Logo（带呼吸灯效果的充电插头图标）+ "EVSE Simulator Pro"。
   - 菜单项：仪表盘(Dashboard)、设备管理(Devices)、单桩控制台(Console)、报文分析器(Analyzer)、场景编排(Scenarios)、压测中心(LoadTest)、系统设置(Settings)。
   - 底部：WebSocket 全局连接状态指示灯（绿闪=Connected，红=Disconnected）+ 当前登录用户。
2. 顶部 Header（高度 60px）：
   - 左侧：面包屑导航 + 全局搜索框（支持搜索设备ID、报文MessageId）。
   - 右侧：全局消息通知（铃铛+红点）、主题切换（Dark/Light）、API 密钥管理入口、用户头像。
3. 主内容区：带 16px 间距的卡片式布局，支持全屏模式。

【设备资产管理页面详细设计】
1. 顶部统计与操作区：
   - 4个数据胶囊：总设备数、在线运行中（绿色）、离线（灰色）、故障模拟中（红色闪烁）。
   - 操作按钮组：
     * [+ 新建单台设备]（主按钮，蓝色）
     * [批量导入]（支持 CSV/JSON 模板下载与上传）
     * [批量导出]
     * [一键全部启动] / [一键全部停止]（带二次确认弹窗）

2. 筛选与分组栏：
   - 左侧 Tab 切换分组：全部设备 / 我的设备 / 共享设备 / 自定义标签组（如“海外测试组”、“液冷超充组”）。
   - 右侧筛选器：协议版本（OCPP 1.6J / 2.0.1 / 私有）、设备型号（7kW AC / 60kW DC / 240kW Liquid Cooling）、连接状态下拉框。

3. 核心设备列表（使用 el-table，支持虚拟滚动以承载 5000+ 设备）：
   - 列配置：
     * 复选框列
     * 设备 ID（带一键复制图标，如 "CP-2024-001"）
     * 设备型号与协议（如 "DC 120kW | OCPP 1.6J"，使用不同颜色的 Tag 区分）
     * 目标服务器 URL（如 "ws://192.168.1.100:8080/ocpp"，超长截断带 Tooltip）
     * 运行状态（带状态点：Online/Offline/Faulted，Faulted 状态带呼吸动画）
     * 当前充电状态（Available/Preparing/Charging/Suspended/Faulted，使用 OCPP 标准状态枚举）
     * CPU/内存占用（微型进度条，仅用于监控模拟器自身资源）
     * 最后心跳时间（相对时间，如 "2秒前"，超过 1 分钟变黄，超过 5 分钟变红）
     * 操作列（固定右侧）：进入控制台(主图标)、启动/停止(开关)、编辑、克隆、删除(红色文字)。
   - 表格行交互：鼠标悬停行背景高亮，点击行展开详情抽屉（Drawer）。

4. 新建/编辑设备抽屉（从右侧滑出，宽度 600px，分步表单 el-steps）：
   - Step 1 基础信息：设备 ID（必填，支持正则校验）、设备型号选择（卡片式单选）、所属分组/标签。
   - Step 2 协议与网络：
     * 协议版本下拉（选择后动态加载对应配置项）。
     * WebSocket URL 输入（带 URL 格式校验）。
     * 认证方式：None / Basic Auth / TLS 证书上传（支持 .pem/.crt）。
     * 心跳间隔（HeartbeatInterval，数字输入，单位：秒，默认 60）。
   - Step 3 硬件参数模拟：
     * 充电枪数量（1~4，数字输入）。
     * 最大输出电压/电流范围（滑块范围选择器）。
     * 电表初始读数（数字输入，单位：kWh）。
   - Step 4 高级设置：
     * 网络延迟模拟（Latency，0~5000ms 滑块）。
     * 丢包率模拟（Packet Loss，0~100% 滑块）。
     * 自动重连策略（开启/关闭，重连间隔，最大重连次数）。

要求：
- 表格支持列宽拖拽、列显隐配置。
- 批量操作时，顶部出现浮动操作条（Floating Action Bar），显示已选数量及批量动作。
- 所有表单输入需带实时校验反馈，URL 输入框旁提供 "Ping/Test Connection" 测试按钮。
```

---

## 提示词 2：单桩深度模拟控制台 (核心业务页)

> **定位**：模拟器最核心的页面。针对单台虚拟充电桩进行深度的状态控制、参数调节、充电流程模拟和底层报文监控。

```text
请生成“单桩深度模拟控制台”页面。这是充电桩模拟器的核心操作台。
技术栈：Vue 3 + Element Plus + ECharts + xterm.js (用于终端模拟)。
UI风格：深色 IDE 风格，高信息密度，多面板可拖拽调整大小（类似 VS Code 布局）。

【页面整体布局】
采用上、中、下三栏布局，中间区域分为左、中、右三列。支持面板折叠和拖拽调整比例。

【顶部状态栏 (高度 50px)】
- 左侧：返回按钮 + 设备 ID（大字号，如 "CP-2024-001"） + 协议版本 Tag + 目标服务器 URL。
- 中间：WebSocket 连接状态（绿色脉冲圆点 + "Connected (Latency: 12ms)"） + 运行时长计时器。
- 右侧：[断开连接] / [重新连接] 按钮、[导出当前会话日志] 按钮、[全屏模式] 按钮。

【中间核心区 - 左列：设备画像与状态机 (宽度 25%)】
1. 设备可视化插画：
   - 根据设备型号（单枪交流/双枪直流/液冷超充）动态渲染对应的 SVG 充电桩插画。
   - 充电枪线缆根据状态变色（灰色=空闲，绿色=充电中，红色=故障）。
2. OCPP 状态机流转图：
   - 使用有向图展示 OCPP 标准状态：Available -> Preparing -> Charging -> SuspendedEV/EVSE -> Finishing -> Available。
   - 当前所处状态节点高亮（发光效果），已走过的路径留下轨迹线。
   - 点击任意状态节点，可强制注入状态变更（弹出确认框："确认发送 StatusNotification 将状态改为 Faulted？"）。
3. 基础配置参数面板（只读展示，可点击编辑）：
   - 固件版本、ICCID、IMSI、序列号、电表精度。

【中间核心区 - 中列：业务流程与参数控制台 (宽度 50%)】
1. 核心动作触发面板（卡片网格布局，2x3）：
   - [BootNotification]：模拟设备启动注册，显示后台返回的 Status (Accepted/Pending/Rejected)。
   - [Authorize]：输入 RFID/Tag ID，模拟刷卡鉴权，显示鉴权结果。
   - [Remote Start]：接收后台下发的远程启动指令（监听状态指示灯）。
   - [Remote Stop]：接收后台下发的远程停止指令。
   - [Reset (Hard/Soft)]：模拟设备重启。
   - [Unlock Connector]：模拟电子锁解锁。
2. 充电流程自动化控制台（核心）：
   - 枪号选择（如：Connector 1 / Connector 2）。
   - 充电模式选择：按电量 / 按时间 / 按金额 / 充满即停。
   - 目标值输入框（如：充电 30 kWh）。
   - [▶ 启动充电事务 (Start Transaction)] 大按钮（绿色渐变）。
   - [⏸ 暂停] / [⏹ 停止充电 (Stop Transaction)] 按钮（充电开始后激活）。
3. 实时电气参数仪表盘与动态调节（充电过程中激活）：
   - 4个圆形仪表盘（ECharts gauge）：电压(V)、电流(A)、实时功率(kW)、电池温度(℃)。
   - 参数手动干预滑块（Slider）：
     * SOC 进度条（0-100%），拖动滑块可瞬间改变 SOC，并自动触发 MeterValues 上报。
     * 功率限制滑块（模拟 BMS 需求或电网限流）。
   - [发送 MeterValues] 按钮：手动触发一次电量/功率数据上报。

【中间核心区 - 右列：告警、故障注入与配置 (宽度 25%)】
1. 故障注入面板（手风琴折叠菜单）：
   - 电气故障：过压、欠压、过流、漏电、CP/CC 信号异常（选择后设置触发延迟和持续时间）。
   - 硬件故障：急停按钮按下(EmergencyStop)、枪头过温、电子锁故障、屏幕黑屏。
   - 通信故障：心跳丢失、JSON 格式错误、消息超时。
   - [💥 注入故障] 红色警示按钮。
2. 本地配置参数修改（ChangeConfiguration 响应）：
   - 列表展示后台下发的配置项（如 MeterValueSampleInterval, ClockAlignedDataInterval）。
   - 支持本地修改并回复后台。
3. 实时告警日志流：
   - 滚动列表，显示触发的故障和告警，带时间戳和严重级别颜色。

【底部区域：WebSocket 报文终端 (高度 30%，可拖拽调整)】
- 集成 xterm.js 或自定义的虚拟终端组件。
- 终端顶部工具栏：
  * 过滤标签：[All] [Sent(上行)] [Received(下行)] [Errors]。
  * 搜索框（高亮匹配报文）。
  * [暂停滚动] / [清空] / [导出 JSON] 按钮。
- 终端内容区：
  * 实时滚动显示 WebSocket 收发报文。
  * 格式：`[10:24:05.123] [SENT] [2, "19283", "MeterValues", {"connectorId": 1, ...}]`
  * JSON 数据自动格式化并带语法高亮（Key 为青色，String 为绿色，Number 为橙色）。
  * 点击任意报文，右侧弹出抽屉显示该报文的详细解析（Schema 校验结果、字段说明）。
- 手动发送区（终端底部输入框）：
  * 支持输入自定义 JSON 报文并发送（提供 OCPP 报文模板下拉快捷填充）。

要求：
- 充电过程中，电气参数仪表盘需有平滑的过渡动画，功率曲线需有微小的随机波动以模拟真实物理环境。
- 报文终端需支持虚拟滚动，确保 10 万条报文不卡顿。
- 所有关键操作（如注入故障、停止充电）需有键盘快捷键支持（如 F5 启动，F6 停止，F8 注入故障）。
```

---

## 提示词 3：OCPP 协议与报文深度分析器

> **定位**：面向协议开发工程师和测试工程师，用于深度分析、对比、Mock 和回放 OCPP 通信报文。

```text
请生成“OCPP 协议与报文深度分析器”页面。
技术栈：Vue 3 + Element Plus + Monaco Editor (代码编辑器) + ECharts。
UI风格：深色专业工具风，类似 Postman 或 Chrome DevTools 的 Network 面板。

【页面布局：左右分栏（左侧 40%，右侧 60%），中间带可拖拽分割线】

【左侧：报文会话列表 (Message Sessions)】
1. 顶部控制区：
   - 设备选择下拉框（选择要分析的虚拟桩）。
   - 录制控制按钮：[● 开始录制] (红色闪烁) / [⏹ 停止] / [🗑️ 清空]。
   - 统计信息：总报文数、上行数、下行数、错误数、平均延迟(ms)。
2. 报文列表表格（高密度表格，行高 36px）：
   - 列：时间戳(HH:mm:ss.SSS)、方向(↑上行/↓下行，带颜色箭头)、MessageTypeId(2/3/4)、Action(如 Heartbeat, StartTransaction)、MessageId、耗时(ms)、状态(OK/Error)。
   - 交互：点击行，右侧详情区联动更新。支持按 Action 类型、时间范围、关键字过滤。
   - 错误行背景标红，超时行背景标黄。

【右侧：报文详情与深度分析区】
顶部 Tab 切换：[报文详情] | [Schema 校验] | [时序图] | [Mock 与回放]

Tab 1: 报文详情 (Payload Details)
   - 左右双面板对比布局（类似 Diff 工具）：
     * 左面板：Request 报文（JSON 树形折叠展示，或 Monaco Editor 只读模式）。
     * 右面板：Response 报文（JSON 树形折叠展示）。
   - 顶部显示：Action 名称、MessageTypeId 说明（如 "2 = Call"）、完整交互耗时。
   - 字段级注释：鼠标悬停在 JSON Key 上，显示 OCPP 官方文档中的字段说明和枚举值含义（Tooltip）。

Tab 2: Schema 校验 (Validation)
   - 显示当前报文对应的 OCPP JSON Schema 校验结果。
   - 校验通过：显示绿色大勾 + "Valid against OCPP 1.6J Schema"。
   - 校验失败：显示红色叉 + 错误列表（如 "Missing required property 'meterStart'"），点击错误项自动在 JSON 编辑器中高亮对应行。

Tab 3: 时序图 (Sequence Diagram)
   - 使用 Mermaid.js 或自定义 SVG 渲染 UML 时序图。
   - 纵轴：Charge Point (Simulator) 和 CSMS (Backend)。
   - 横轴：时间线。
   - 自动将选中的报文列表转换为时序图箭头（如 CP -> CSMS: BootNotification，CSMS -> CP: BootNotificationResponse）。
   - 支持缩放、平移，点击箭头可高亮左侧列表中的对应报文。

Tab 4: Mock 与回放 (Mock & Replay)
   - Mock 规则配置：
     * 拦截特定 Action（如 Authorize），自定义返回结果（如强制返回 IdTagStatus: "Invalid"）。
     * 提供可视化表单配置 Mock 响应，或直接在 Monaco Editor 中编写 JSON。
   - 报文回放：
     * 选择一段录制的报文会话，设置回放速率（1x, 2x, 5x, 10x）。
     * [▶ 开始回放] 按钮，模拟器将按时间戳间隔自动向后台重放这些报文。

要求：
- Monaco Editor 需配置 JSON 语法高亮、自动折叠、行号显示。
- 报文列表需支持右键菜单：复制为 cURL、复制 JSON、导出为 HAR 格式。
- 时序图需支持导出为 PNG/SVG。
```

---

## 提示词 4：自动化场景编排引擎 (低代码测试流)

> **定位**：将复杂的充电业务流程（如：刷卡->鉴权->启动->充电->拔枪->结算）封装为可复用的自动化测试用例，支持可视化拖拽编排。

```text
请生成“自动化场景编排引擎”页面。
技术栈：Vue 3 + Vue Flow (或 LogicFlow) + Element Plus。
UI风格：深色节点编辑器风格，类似 Node-RED 或 Unreal Engine 蓝图。

【页面布局：三栏式经典节点编辑器布局】

【左侧：节点组件库 (Node Palette) (宽度 200px)】
- 分类折叠面板，支持搜索节点。
- 节点分类：
  1. 触发器 (Triggers)：手动触发、定时触发、Webhook 触发、收到后台指令触发。
  2. OCPP 动作 (Actions)：BootNotification, Heartbeat, StatusNotification, Authorize, StartTransaction, MeterValues, StopTransaction, DataTransfer。
  3. 控制流 (Control)：延迟等待(Delay)、条件判断(IF/Switch)、循环(Loop)、并行执行(Parallel)。
  4. 故障注入 (Faults)：断网模拟、状态突变、报文篡改。
  5. 断言与校验 (Assertions)：校验后台响应状态、校验耗时、校验特定字段值。
- 交互：节点支持拖拽到中间画布。

【中间：可视化编排画布 (Canvas) (占据剩余空间)】
- 顶部工具栏：
  * 场景名称输入框 + 保存按钮。
  * 运行控制：[▶ 运行]、[⏸ 暂停]、[⏹ 停止]、[单步执行]。
  * 画布控制：缩放(Slider)、适应屏幕、网格对齐开关、小地图(Minimap)开关。
  * 撤销/重做 (Ctrl+Z / Ctrl+Y)。
- 画布区：
  * 节点样式：圆角矩形，左侧带分类颜色条（如动作类为蓝色，控制流为黄色，断言为绿色）。
  * 节点内容：图标 + 节点名称 + 核心参数摘要（如 Delay 节点显示 "Wait: 5s"）。
  * 连线：带箭头的贝塞尔曲线，数据流向动画（虚线流动效果）。
  * 交互：拖拽节点、连线（从输出锚点拖到输入锚点）、框选多选、复制粘贴。
- 运行状态反馈：
  * 运行时，当前执行到的节点边框高亮发光，连线变为绿色实线，已执行完毕的节点打勾，执行失败的节点标红并显示错误气泡。

【右侧：属性配置面板 (Properties Panel) (宽度 300px)】
- 当未选中节点时：显示场景全局配置（目标设备选择、全局变量定义、超时时间设置）。
- 当选中节点时：动态渲染该节点的配置表单。
  * 例如选中 "StartTransaction" 节点：
    - ConnectorId (数字输入)
    - IdTag (字符串输入，支持引用全局变量 `${user_tag}`)
    - MeterStart (数字输入)
    - Timestamp (时间选择器，默认当前时间)
  * 例如选中 "IF 条件判断" 节点：
    - 条件表达式输入（如 `response.idTagInfo.status == 'Accepted'`）。
    - True 分支和 False 分支的连线配置。

【底部：运行日志与结果面板 (高度 200px，可折叠)】
- 实时输出场景运行的 Console 日志（类似 IDE 的 Output 面板）。
- 断言结果列表：通过(绿)、失败(红)，点击失败项可跳转到画布中对应的断言节点。

要求：
- 画布需支持键盘快捷键（Delete 删除，Ctrl+D 复制，Ctrl+A 全选）。
- 节点配置支持 JSONPath 或模板字符串提取上游节点的输出数据作为当前节点的输入。
- 提供“预置场景模板”库（如：标准交流充电流程、直流快充BMS交互流程、断网重连测试），可一键加载到画布。
```

---

## 提示词 5：分布式压测中心与实时监控大屏

> **定位**：模拟成千上万个虚拟充电桩同时并发连接和充电，测试后端 CSMS 平台的性能瓶颈，并提供实时的压测监控大屏。

```text
请生成“分布式压测中心与实时监控大屏”页面。
技术栈：Vue 3 + Element Plus + ECharts (大量复杂图表) + WebSocket。
UI风格：数据可视化大屏风格，深色背景，霓虹色数据指标，科技感强。

【页面分为两个视图模式：压测配置模式 (Config) 和 实时监控模式 (Monitor)，通过顶部大 Tab 切换】

【视图一：压测配置模式 (Config)】
1. 压测基础配置卡片：
   - 压测名称、描述。
   - 目标服务器集群 URL（支持多节点配置）。
   - 协议版本选择。
2. 并发模型配置（核心）：
   - 设备总数目标（数字输入，如 10,000，带千分位格式化）。
   - 启动策略（Ramp-up）：
     * 阶梯式：每 10 秒启动 500 台。
     * 线性：每秒启动 100 台。
     * 脉冲：瞬间启动 2000 台，保持 1 分钟，再启动 2000 台。
   - 持续时间（如：30 分钟 / 直到手动停止）。
3. 业务行为模型 (Behavior Profile)：
   - 行为权重配置（滑块或百分比输入，总和 100%）：
     * 纯心跳保活 (Heartbeat only)：60%
     * 完整充电流程 (Start->Meter->Stop)：30%
     * 频繁鉴权与异常注入：10%
   - 充电参数分布：设置 SOC 增长速率、功率波动的正态分布参数（均值、方差）。
4. 分布式执行节点管理：
   - 列表展示可用的压测执行机（Agent）：IP、CPU/内存状态、当前承载设备数、最大承载数。
   - 支持手动分配任务到指定 Agent，或选择“自动均衡调度”。
5. 底部操作区：[保存配置]、[▶ 启动压测]（大按钮，带倒计时 3,2,1 确认）。

【视图二：实时监控模式 (Monitor) - 压测启动后自动切换】
1. 顶部核心指标跑马灯（大字号，带数字滚动动画）：
   - 虚拟设备总数 | 当前在线数 | 每秒新建连接数 (CPS) | 消息吞吐量 (msg/s) | 平均响应延迟 (ms) | P99 延迟 (ms) | 错误率 (%)。
   - 指标超阈值（如 P99 > 1000ms 或 错误率 > 1%）时，数字变红并闪烁。

2. 四宫格核心图表区（ECharts，支持全屏放大）：
   - 左上：【并发连接数趋势图】（折线图，双 Y 轴：左轴连接数，右轴断开数。带渐变面积填充）。
   - 右上：【消息吞吐量堆叠图】（堆叠柱状图或面积图，分层显示：Boot, Heartbeat, MeterValues, Start/Stop Tx，不同颜色区分）。
   - 左下：【响应延迟分布】（直方图/箱线图，动态更新，标注 P50, P90, P99, P99.9 垂直参考线）。
   - 右下：【错误码 Top 5 饼图】（如 WebSocket Close, Timeout, OCPP Reject，带具体数量标签）。

3. 底部详细数据面板（Tab 切换）：
   - Tab 1: 实时错误日志流（表格：时间、Agent 节点、设备 ID、错误类型、报文摘要。支持按错误类型筛选）。
   - Tab 2: Agent 节点负载监控（表格：节点 IP、CPU 使用率进度条、内存使用率、网络 IO、当前虚拟设备数）。
   - Tab 3: 后台响应状态码统计（表格：Action 名称、Success 数量、Reject 数量、Timeout 数量、平均耗时）。

4. 右上角悬浮控制台：
   - [⏸ 暂停新增设备] / [⏹ 终止压测] 按钮。
   - [📥 导出实时快照报告] 按钮。

要求：
- 所有图表必须支持 WebSocket 实时数据推送（每秒刷新），图表动画需平滑，避免闪烁。
- 数字指标使用 `odometer` 或类似库实现数字滚动效果。
- 当压测结束时，自动生成一份包含图表截图和数据分析的 PDF/HTML 压测报告，并提供下载链接。
```

---

## 提示词 6：系统设置、Mock 服务与全局日志中心

> **定位**：模拟器的全局配置、证书管理、全局报文 Mock 规则，以及跨设备的全局日志检索与分析。

```text
请生成“系统设置与全局日志中心”页面。
技术栈：Vue 3 + Element Plus + Monaco Editor + Elasticsearch (前端对接 ES 查询 DSL)。
UI风格：标准后台管理风格，清晰、严谨。

【左侧菜单树】
- 全局配置 (Global Config)
- 证书与密钥管理 (Certificates & Keys)
- 全局 Mock 规则 (Global Mocking)
- 全局日志中心 (Log Center)
- 数据字典与枚举 (Data Dictionary)

【页面一：全局配置 (Global Config)】
- 采用分组表单布局（el-collapse 折叠面板）：
  1. 网络与代理：全局 HTTP/SOCKS5 代理设置、DNS 配置、超时时间全局默认值。
  2. 协议默认参数：默认的 HeartbeatInterval、MeterValueSampleInterval、各类超时时间（如 RemoteStart 超时）。
  3. 存储与清理：本地日志保留天数、自动清理策略、数据库（如 SQLite/IndexedDB）容量监控与手动压缩。

【页面二：证书与密钥管理 (Certificates & Keys)】
- 针对 OCPP 2.0.1 的 TLS 安全配置：
  - CA 根证书管理：上传/查看/删除 PEM 格式证书。
  - 客户端证书（Client Certs）：为特定设备或设备组绑定 TLS 证书。
  - 密钥对生成工具：内置 RSA/ECC 密钥对生成器，支持导出 CSR 文件。
  - 证书有效期监控列表：高亮即将过期的证书（30天内黄色，7天内红色）。

【页面三：全局 Mock 规则 (Global Mocking)】
- 用于拦截后台下发的指令并模拟特定响应（无需在单桩控制台手动操作）。
- 规则列表表格：
  - 列：规则名称、匹配条件（如 Action = "RemoteStartTransaction" 且 IdTag = "BADGE_01"）、Mock 动作（返回 Reject / 延迟 5 秒后返回 Accepted / 抛出 WebSocket 断连）、状态（启用/禁用开关）、优先级。
- [新增规则] 抽屉：
  - 条件构建器：可视化添加 AND/OR 条件组。
  - 响应编辑器：Monaco Editor 编写 JSON 响应模板，支持使用 `${}` 注入动态变量（如 `${random_uuid}`）。

【页面四：全局日志中心 (Log Center) - 核心页面】
- 类似 Kibana 的日志检索界面。
1. 顶部搜索与过滤区：
   - KQL (Kibana Query Language) 风格搜索框：支持 `device_id:"CP-001" AND action:"StartTransaction" AND status:"Error"`。
   - 时间范围选择器（最近 15 分钟 / 1 小时 / 今天 / 自定义）。
   - 快速过滤标签：仅看错误、仅看超时、仅看特定设备组。
2. 日志结果展示区：
   - 顶部：时间直方图（Time Histogram），显示日志数量随时间的分布，支持框选放大时间段。
   - 下方：日志列表（表格）：
     * 时间戳、日志级别 (INFO/WARN/ERROR/DEBUG，带颜色 Tag)、设备 ID、模块 (WS/Protocol/Engine)、日志内容摘要。
   - 交互：点击行展开 JSON 详情（包含完整的上下文 Context、堆栈信息 StackTrace）。
3. 侧边栏字段聚合 (Field Aggregations)：
   - 显示 Top 5 错误类型、Top 5 活跃设备、日志级别分布饼图，点击可快速添加过滤条件。

要求：
- 日志列表需支持虚拟滚动，确保百万级日志查询结果流畅渲染。
- 搜索框需提供自动补全（Auto-complete）提示可用的字段名和枚举值。
- 支持将当前检索条件保存为“监控视图 (Saved View)”。
```

---

### 💡 给 AI 编码工具的附加系统级指令 (System Prompt 补充)

在将上述提示词喂给 AI 时，建议在对话开头加上这段**全局约束**，以确保生成的代码质量：

```text
【全局编码约束】
1. 组件化：所有页面必须拆分为高内聚、低耦合的 Vue 3 组件（SFC），使用 `<script setup lang="ts">`。
2. 状态管理：使用 Pinia 管理全局状态（如 WebSocket 连接状态、当前选中设备、全局配置），避免 prop drilling。
3. 响应式与性能：大量数据列表必须使用虚拟滚动（如 `vue-virtual-scroller` 或 Element Plus 的 `el-table-v2`）；图表数据更新需做防抖/节流处理。
4. 类型安全：为所有 OCPP 报文、设备状态、API 响应定义严格的 TypeScript Interface/Type，禁止使用 `any`。
5. 样式隔离：使用 TailwindCSS 进行原子化布局，复杂组件样式使用 Scoped CSS 或 CSS Modules，严禁全局样式污染。
6. Mock 数据：在 API 未就绪时，使用 MSW (Mock Service Worker) 或本地 JSON 文件提供逼真的 Mock 数据（包含随机波动和合理的延迟）。
```