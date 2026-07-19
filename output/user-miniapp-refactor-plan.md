# 用户端小程序 UI/UX 重构方案

> 参考设计：充电页面.png (750×1624, iPhone 截图)
> 设计规范：前端/用户端小程序.md (9个提示词模块)
> 重构日期：2026-07-19

---

## 一、当前状态分析

### 1.1 现有页面清单（21页）

| 分类 | 页面 | 文件路径 | 当前完成度 |
|------|------|----------|-----------|
| **核心Tab** | 首页 | pages/index/index.vue | 60% |
| | 找桩(地图) | pages/map/index.vue | 50% |
| | 订单 | pages/order/index.vue | 40% |
| | 我的 | pages/profile/index.vue | 50% |
| **充电流程** | 充电中 | pages/charging/index.vue | 30% |
| | 充电设置 | pages/charging-settings/index.vue | 30% |
| | 充电结算 | pages/settlement/index.vue | 60% |
| **钱包** | 钱包首页 | pages/wallet/index.vue | 40% |
| | 充值 | pages/recharge/index.vue | 40% |
| | 优惠券 | pages/coupon/index.vue | 40% |
| **订单** | 订单详情 | pages/order-detail/index.vue | 40% |
| | 退款 | pages/refund/index.vue | 30% |
| | 发票 | pages/invoice/index.vue | 30% |
| **站点** | 站点详情 | pages/station-detail/index.vue | 40% |
| **用户中心** | 车辆管理 | pages/vehicles/index.vue | 30% |
| | 会员中心 | pages/membership/index.vue | 40% |
| | 积分商城 | pages/points/index.vue | 30% |
| | 收藏站点 | pages/favorites/index.vue | 30% |
| | 消息中心 | pages/messages/index.vue | 30% |
| | 设置 | pages/settings/index.vue | 30% |
| **认证** | 登录 | pages/login/index.vue | 50% |

### 1.2 现有组件（5个）

| 组件 | 文件 | 状态 |
|------|------|------|
| Skeleton | components/Skeleton.vue | 已实现，基础版 |
| EmptyState | components/EmptyState.vue | 已实现，基础版 |
| QuickActions | components/QuickActions.vue | 已实现，4宫格 |
| StationCard | components/StationCard.vue | 已实现，基础版 |
| OrderCard | components/OrderCard.vue | 已实现，基础版 |

### 1.3 现有设计风格问题

| 问题 | 现状 | 目标（设计规范） |
|------|------|-----------------|
| 主色调 | #07C160 ✅ | 一致 |
| 充电中页面 | 浅色背景，进度条 | **深色背景(#0A1628→#1A2744)，圆环动画** |
| SOC展示 | 普通进度条 | **Canvas 圆环 + 粒子流光** |
| 图标 | Emoji (⚡🗺📋👤) | **自定义SVG图标系统** |
| 卡片圆角 | 12rpx | **16rpx（更大圆角）** |
| 地图交互 | 固定6:4分割 | **可拖拽调整比例(30%~85%)** |
| TabBar | 4Tab（首页/找桩/订单/我的） | **4Tab（首页/订单/钱包/我的）+ 充电中浮层** |
| 扫码入口 | 页面内按钮 | **导航栏呼吸灯效果 + 全局悬浮** |
| 充电动画 | 无 | **Canvas 60fps 圆环+粒子+呼吸** |
| 电价显示 | 纯文字 | **24h电价时间轴图表** |
| 订单详情 | Modal弹窗 | **完整页面 + 电子小票风格** |

---

## 二、重构范围（按优先级分4个阶段）

### 阶段 1：设计系统 + 核心充电流程（最高优先级）

**目标：** 建立统一设计语言，重构最核心的充电体验

#### 1.1 全局设计系统
- [ ] `styles/variables.scss` — 设计令牌（颜色/间距/圆角/字号/阴影）
- [ ] `styles/global.scss` — 全局样式重置 + 通用工具类
- [ ] `styles/animations.scss` — 动画库（呼吸/流光/弹入/渐变）
- [ ] `components/CustomTabBar.vue` — 自定义底部TabBar（含充电中浮层）
- [ ] `components/CustomNavBar.vue` — 自定义顶部导航栏（定位+搜索+扫一扫）
- [ ] `components/IconFont.vue` — SVG图标组件系统
- [ ] `components/ChargeButton.vue` — 品牌按钮组件（渐变/loading/禁用态）

#### 1.2 充电进行中页面（重写）
- [ ] `pages/charging/index.vue` — 深色沉浸式背景 + Canvas圆环SOC + 实时数据面板
- [ ] `components/ChargeRing.vue` — Canvas 2D 充电圆环组件（60fps动画）
- [ ] `components/PowerCurve.vue` — mini功率曲线折线图
- [ ] `components/ChargeMetrics.vue` — 实时数据4指标面板

#### 1.3 扫码充电流程
- [ ] `pages/scan/index.vue` — 扫码页面（相机取景+扫描线动画）
- [ ] `pages/charging-settings/index.vue` — 充电设置页（充电方式/优惠券/支付）

#### 1.4 充电结算页（增强）
- [ ] `pages/settlement/index.vue` — 增加充电数据摘要+环保卡片+动画

### 阶段 2：首页 + 地图找站

#### 2.1 首页重构
- [ ] `pages/index/index.vue` — 自定义NavBar + 充电状态卡片 + 快捷操作 + 附近站点

#### 2.2 地图找站页（重写）
- [ ] `pages/map/index.vue` — 地图60% + 可拖拽列表 + 筛选浮层 + 联动
- [ ] `components/StationSheet.vue` — 可拖拽底部面板组件
- [ ] `components/FilterBar.vue` — 筛选胶囊按钮组
- [ ] `pages/search/index.vue` — 搜索页（历史/热词/联想）

#### 2.3 站点详情页（增强）
- [ ] `pages/station-detail/index.vue` — 电价时间轴 + 设施网格 + 评价区域

### 阶段 3：订单 + 钱包

#### 3.1 订单模块
- [ ] `pages/order/index.vue` — 分月列表 + 左滑操作 + 虚拟滚动
- [ ] `pages/order-detail/index.vue` — 电子小票风格（锯齿边+分段计费）
- [ ] `components/ReceiptCard.vue` — 电子小票组件
- [ ] `pages/refund/index.vue` — 退款申请表单
- [ ] `pages/invoice/index.vue` — 发票管理

#### 3.2 钱包模块
- [ ] `pages/wallet/index.vue` — 渐变资产卡 + 快充档位 + 交易记录
- [ ] `pages/recharge/index.vue` — 充值详情 + 成功动画
- [ ] `pages/coupon/index.vue` — 券卡片（撕裂效果）+ 分Tab
- [ ] `components/CouponCard.vue` — 优惠券卡片组件

### 阶段 4：用户中心 + 辅助页面

#### 4.1 我的页面
- [ ] `pages/profile/index.vue` — 渐变头部 + 数据概览 + 功能网格
- [ ] `pages/settings/index.vue` — 设置列表
- [ ] `pages/favorites/index.vue` — 收藏站点列表
- [ ] `pages/messages/index.vue` — 消息中心
- [ ] `pages/vehicles/index.vue` — 车辆管理
- [ ] `pages/login/index.vue` — 登录弹窗优化

#### 4.2 会员 + 积分
- [ ] `pages/membership/index.vue` — 会员卡 + 权益展示
- [ ] `pages/points/index.vue` — 积分商城

---

## 三、设计令牌定义（预览）

```scss
// ===== 颜色系统 =====
$primary: #07C160;          // 充电绿（主色）
$primary-dark: #06AD56;     // 充电绿深色
$primary-light: #E8F8EE;    // 充电绿浅色背景
$secondary: #1677FF;        // 活力蓝（辅助色）
$bg-page: #F6F7FB;          // 页面背景
$bg-card: #FFFFFF;          // 卡片背景
$text-primary: #1A1A1A;     // 主文字
$text-secondary: #666666;   // 次文字
$text-tertiary: #999999;    // 辅助文字
$success: #52C41A;
$warning: #FAAD14;
$error: #FF4D4F;

// 充电中深色主题
$charge-bg-start: #0A1628;
$charge-bg-end: #1A2744;
$charge-accent: #00E5A0;    // 充电高亮绿
$charge-text: #FFFFFF;

// ===== 间距（12rpx网格）=====
$space-xs: 8rpx;
$space-sm: 12rpx;
$space-md: 16rpx;
$space-lg: 24rpx;
$space-xl: 32rpx;
$space-2xl: 48rpx;

// ===== 圆角 =====
$radius-sm: 8rpx;
$radius-md: 12rpx;
$radius-lg: 16rpx;
$radius-xl: 24rpx;
$radius-full: 999rpx;

// ===== 阴影 =====
$shadow-sm: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
$shadow-md: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
$shadow-lg: 0 8rpx 32rpx rgba(0, 0, 0, 0.12);

// ===== 字号 =====
$font-xs: 20rpx;
$font-sm: 22rpx;
$font-base: 24rpx;
$font-md: 26rpx;
$font-lg: 28rpx;
$font-xl: 32rpx;
$font-2xl: 36rpx;
$font-3xl: 40rpx;
$font-4xl: 48rpx;
```

---

## 四、执行策略

使用 Dynamic Workflow 并行重构，每个阶段分配多个子代理：

1. **Phase 1（设计系统 + 充电流程）** — 最高优先级，先建基础再重构核心
2. **Phase 2（首页 + 地图）** — Phase 1 完成后启动
3. **Phase 3（订单 + 钱包）** — 可与 Phase 2 并行
4. **Phase 4（用户中心）** — 最后执行

每阶段完成后运行 E2E 测试验证：
```bash
npx playwright test apps/user-miniapp/e2e/
```
