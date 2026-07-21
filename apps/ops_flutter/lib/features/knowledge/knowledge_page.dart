import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'package:ops_flutter/core/theme/app_theme.dart';
import 'package:ops_flutter/shared/widgets/common_widgets.dart';

// ──────────────────────────────────────────────────────────────
// Models
// ──────────────────────────────────────────────────────────────

class KnowledgeArticle {
  final String id;
  final String title;
  final String category;
  final String summary;
  final String content;
  final DateTime updatedAt;
  final int viewCount;

  const KnowledgeArticle({
    required this.id,
    required this.title,
    required this.category,
    required this.summary,
    required this.content,
    required this.updatedAt,
    this.viewCount = 0,
  });
}

// ──────────────────────────────────────────────────────────────
// Mock Data
// ──────────────────────────────────────────────────────────────

class KnowledgeMockData {
  KnowledgeMockData._();

  static const Map<String, IconData> categoryIcons = {
    '故障排查': Icons.build_rounded,
    '操作手册': Icons.menu_book_rounded,
    '安全规范': Icons.shield_rounded,
    'FAQ': Icons.help_outline_rounded,
  };

  static const Map<String, Color> categoryColors = {
    '故障排查': AppTheme.error,
    '操作手册': AppTheme.brandBlue,
    '安全规范': AppTheme.warning,
    'FAQ': AppTheme.success,
  };

  static final List<KnowledgeArticle> articles = [
    KnowledgeArticle(
      id: 'KB001',
      title: '充电桩无法启动充电 — 故障排查指南',
      category: '故障排查',
      summary: '系统介绍充电桩无法启动充电的常见原因及排查步骤',
      content: '''# 充电桩无法启动充电 — 故障排查指南

## 适用场景
充电桩扫码/刷卡后无反应，或显示"启动失败"。

## 排查步骤

### 1. 检查供电状态
- 确认配电柜空开是否合闸
- 检查三相电压是否正常（380V ±10%）
- 使用万用表测量输入端子电压

### 2. 检查通信状态
- 确认 4G/5G 信号指示灯是否正常
- 检查后台是否显示设备在线
- 重启通信模块（断电 30 秒后重新上电）

### 3. 检查充电枪
- 检查枪头是否有物理损坏
- 确认枪头锁止机构是否正常
- 测量枪头控制导引信号（CP 信号）

### 4. 检查软件状态
- 查看设备日志中的错误码
- 根据错误码查询故障表
- 必要时进行远程重启

## 常见错误码
| 错误码 | 含义 | 处理方式 |
|--------|------|----------|
| E001 | 通信超时 | 重启通信模块 |
| E002 | 绝缘检测失败 | 检查充电枪和线缆 |
| E003 | 过温保护 | 检查散热系统 |
| E004 | 漏电保护 | 检查接地和漏保装置 |

## 注意事项
- 操作前务必断开主电源
- 涉及高压部分需两人操作
- 记录排查过程和结果''',
      updatedAt: DateTime(2026, 7, 15),
      viewCount: 342,
    ),
    KnowledgeArticle(
      id: 'KB002',
      title: '日常巡检操作手册',
      category: '操作手册',
      summary: '充电站日常巡检标准操作流程及检查要点',
      content: '''# 日常巡检操作手册

## 巡检频次
- **常规站点**：每日 1 次
- **高负荷站点**：每日 2 次（上午 + 下午）
- **故障修复后**：24 小时内复查

## 巡检内容

### 1. 外观检查
- [ ] 设备外壳无变形、无锈蚀
- [ ] 显示屏正常显示
- [ ] 指示灯状态正常
- [ ] 充电枪摆放整齐

### 2. 环境检查
- [ ] 站点地面无积水
- [ ] 消防器材在有效期内
- [ ] 安全标识清晰可见
- [ ] 照明设备正常

### 3. 功能测试
- [ ] 随机选取 1 台设备进行充电测试
- [ ] 测试急停按钮功能
- [ ] 检查刷卡/扫码功能
- [ ] 验证计费准确性

### 4. 数据核对
- [ ] 核对当日充电量与系统记录
- [ ] 检查设备在线率
- [ ] 查看未处理告警

## 巡检记录
巡检完成后在 App 中提交巡检报告，包含：
- 巡检时间
- 巡检设备编号
- 发现的问题
- 处理措施
- 现场照片（至少 3 张）''',
      updatedAt: DateTime(2026, 7, 12),
      viewCount: 567,
    ),
    KnowledgeArticle(
      id: 'KB003',
      title: '高压作业安全规范',
      category: '安全规范',
      summary: '涉及高压设备操作时的安全注意事项和防护要求',
      content: '''# 高压作业安全规范

## 适用范围
所有涉及充电桩高压部分（>60V DC 或 >30V AC）的检修、维护作业。

## 安全等级
| 等级 | 电压范围 | 人员要求 |
|------|----------|----------|
| 一级 | 60V-150V | 持证电工 |
| 二级 | 150V-500V | 高级电工 + 安全员 |
| 三级 | >500V | 专业维修团队 |

## 作业前准备
1. **断电确认**：断开上级空开，悬挂"禁止合闸"标识牌
2. **验电操作**：使用验电器确认设备已完全断电
3. **放电操作**：对直流母排电容进行放电（等待 ≥5 分钟）
4. **接地操作**：在检修设备两端挂接地线
5. **个人防护**：穿戴绝缘手套、绝缘鞋、安全帽

## 作业中要求
- 至少两人作业，一人操作一人监护
- 不得带电操作
- 使用绝缘工具
- 保持通信畅通
- 异常情况立即停止作业

## 作业后恢复
1. 清点工具和材料
2. 撤除接地线
3. 确认所有人员撤离
4. 逐级送电
5. 测试设备功能正常

## 应急处理
- 发现触电：立即切断电源，进行心肺复苏
- 发现火灾：使用干粉灭火器，拨打 119
- 发现电弧烧伤：立即冷却伤口，拨打 120''',
      updatedAt: DateTime(2026, 7, 10),
      viewCount: 891,
    ),
    KnowledgeArticle(
      id: 'KB004',
      title: 'OCPP 协议常见问题解答',
      category: 'FAQ',
      summary: '运维人员常问的 OCPP 通信协议相关问题',
      content: '''# OCPP 协议常见问题解答

## Q1: OCPP 是什么？
**A:** OCPP（Open Charge Point Protocol）是开放充电点协议，用于充电桩与后端管理系统之间的通信。目前主流版本为 OCPP 1.6 和 OCPP 2.0。

## Q2: 设备显示"离线"但网络正常，怎么处理？
**A:** 按以下步骤排查：
1. 检查设备端 OCPP 配置（URL、CP ID）
2. 查看设备日志是否有 WebSocket 连接记录
3. 检查服务器端是否收到连接请求
4. 重启设备通信模块

## Q3: 如何查看设备的 OCPP 消息日志？
**A:** 通过运维 App → 设备详情 → 通信日志，可以查看最近 24 小时的 OCPP 消息收发记录。支持按消息类型筛选（BootNotification, Heartbeat, StartTransaction 等）。

## Q4: Heartbeat 超时多久会判定设备离线？
**A:** 默认配置为 3 次 Heartbeat 未响应（约 3 分钟），可在管理后台 → 系统设置 → 设备管理中调整。

## Q5: 设备固件升级失败怎么恢复？
**A:**
1. 确认设备当前状态（是否还在下载中）
2. 如果下载失败，等待 5 分钟后重新触发升级
3. 如果升级中断导致设备异常，使用本地 USB 刷机工具恢复
4. 刷机后需重新配置网络和 OCPP 参数''',
      updatedAt: DateTime(2026, 7, 18),
      viewCount: 234,
    ),
    KnowledgeArticle(
      id: 'KB005',
      title: '充电枪维护保养手册',
      category: '操作手册',
      summary: '充电枪的定期保养流程及常见问题处理',
      content: '''# 充电枪维护保养手册

## 保养周期
| 项目 | 周期 | 负责人 |
|------|------|--------|
| 外观清洁 | 每周 | 运维人员 |
| 触头检查 | 每月 | 运维人员 |
| 绝缘测试 | 每季度 | 专业技师 |
| 整枪更换 | 按寿命 | 供应商 |

## 外观清洁
1. 使用干净软布擦拭枪体
2. 用无水酒精清洁触头（禁止用水）
3. 检查线缆外皮是否有破损
4. 检查锁止机构是否灵活

## 触头检查
1. 目视检查触头是否有烧蚀痕迹
2. 测量触头接触电阻（应 <0.5mΩ）
3. 检查触头弹簧弹力
4. 必要时涂抹导电膏

## 常见问题
- **枪头卡扣松动**：更换卡扣弹簧
- **触头发热**：清洁触头或更换枪头
- **锁止失灵**：检查电磁锁和控制电路
- **线缆破损**：立即停用，更换线缆''',
      updatedAt: DateTime(2026, 7, 8),
      viewCount: 189,
    ),
    KnowledgeArticle(
      id: 'KB006',
      title: '充电站消防安全规范',
      category: '安全规范',
      summary: '充电站消防安全要求、应急预案和消防器材配置标准',
      content: '''# 充电站消防安全规范

## 消防器材配置标准

### 小型站点（≤4 台设备）
- 4kg 干粉灭火器 × 2
- 灭火毯 × 1
- 消防沙箱 × 1

### 中型站点（5-10 台设备）
- 4kg 干粉灭火器 × 4
- 35L 推车式灭火器 × 1
- 灭火毯 × 2
- 消防沙箱 × 2

### 大型站点（>10 台设备）
- 按建筑面积计算，每 50㎡ 配备 1 具灭火器
- 自动喷淋系统
- 烟感报警系统
- 应急照明系统

## 应急预案

### 1. 设备冒烟/起火
1. 按下急停按钮
2. 断开上级电源
3. 使用干粉灭火器灭火
4. 拨打 119
5. 疏散周边人员

### 2. 人员触电
1. 切断电源（使用绝缘工具）
2. 将伤员移至安全区域
3. 检查生命体征
4. 必要时进行心肺复苏
5. 拨打 120

### 3. 电池热失控
1. 立即停止所有充电作业
2. 疏散半径 ≥15 米
3. 使用大量水冷却（电池火灾专用）
4. 禁止使用干粉灭火器
5. 等待消防部门处置

## 日常检查
- [ ] 灭火器压力表指针在绿色区域
- [ ] 消防通道畅通无阻
- [ ] 应急照明灯工作正常
- [ ] 烟感报警器工作正常''',
      updatedAt: DateTime(2026, 7, 5),
      viewCount: 456,
    ),
    KnowledgeArticle(
      id: 'KB007',
      title: '运维 App 使用指南',
      category: 'FAQ',
      summary: '运维移动端 App 的功能介绍和操作说明',
      content: '''# 运维 App 使用指南

## 主要功能

### 1. 扫码巡检
- 扫描设备二维码开始巡检
- 按照检查清单逐项确认
- 拍照记录问题
- 提交巡检报告

### 2. 工单处理
- 查看待接单工单
- 接单并前往现场
- 记录维修过程
- 完成工单并上传照片

### 3. 告警处理
- 实时接收告警推送
- 查看告警详情
- 执行处理操作
- 记录处理结果

### 4. 备件管理
- 查看备件库存
- 申请所需备件
- 记录消耗明细

### 5. 知识库
- 浏览故障排查指南
- 查阅操作手册
- 学习安全规范

## 常见问题
**Q: App 无法登录？**
A: 检查网络连接，确认账号密码正确。如仍无法登录，联系管理员重置密码。

**Q: 扫码没有反应？**
A: 确认已授予相机权限。如二维码模糊，尝试调整拍摄距离和角度。

**Q: 提交报告失败？**
A: 检查网络连接和照片大小（单张不超过 5MB）。可在"草稿箱"中重新提交。''',
      updatedAt: DateTime(2026, 7, 19),
      viewCount: 678,
    ),
  ];
}

// ──────────────────────────────────────────────────────────────
// Knowledge Base Page
// ──────────────────────────────────────────────────────────────

class KnowledgePage extends StatefulWidget {
  const KnowledgePage({super.key});

  @override
  State<KnowledgePage> createState() => _KnowledgePageState();
}

class _KnowledgePageState extends State<KnowledgePage> {
  // ── State ──────────────────────────────────────────────────────
  String _selectedCategory = '全部';
  String _keyword = '';
  final TextEditingController _searchController = TextEditingController();
  List<KnowledgeArticle> _filteredArticles = [];

  static const _categories = ['全部', '故障排查', '操作手册', '安全规范', 'FAQ'];

  @override
  void initState() {
    super.initState();
    _applyFilters();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _applyFilters() {
    final articles = KnowledgeMockData.articles.where((a) {
      final matchCategory =
          _selectedCategory == '全部' || a.category == _selectedCategory;
      final matchKeyword = _keyword.isEmpty ||
          a.title.toLowerCase().contains(_keyword.toLowerCase()) ||
          a.summary.toLowerCase().contains(_keyword.toLowerCase());
      return matchCategory && matchKeyword;
    }).toList();

    setState(() {
      _filteredArticles = articles;
    });
  }

  void _onSearchChanged(String value) {
    _keyword = value.trim();
    _applyFilters();
  }

  void _onCategoryChanged(String category) {
    setState(() {
      _selectedCategory = category;
    });
    _applyFilters();
  }

  // ── Build ──────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        title: const Text('知识库'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 20),
          onPressed: () => context.pop(),
        ),
      ),
      body: Column(
        children: [
          _buildSearchBar(),
          _buildCategoryNav(),
          Expanded(child: _buildArticleList()),
        ],
      ),
    );
  }

  // ── Search Bar ─────────────────────────────────────────────────
  Widget _buildSearchBar() {
    return Container(
      padding: const EdgeInsets.fromLTRB(
        AppTheme.spacingLg,
        AppTheme.spacingSm,
        AppTheme.spacingLg,
        AppTheme.spacingMd,
      ),
      color: AppTheme.backgroundWhite,
      child: TextField(
        controller: _searchController,
        onChanged: _onSearchChanged,
        style: AppTheme.bodyMedium,
        decoration: InputDecoration(
          hintText: '搜索文章标题或内容',
          hintStyle: AppTheme.bodyMedium.copyWith(color: AppTheme.textHint),
          prefixIcon: const Icon(Icons.search_rounded, color: AppTheme.textHint, size: 20),
          suffixIcon: _searchController.text.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.cancel_rounded, color: AppTheme.textHint, size: 18),
                  onPressed: () {
                    _searchController.clear();
                    _onSearchChanged('');
                  },
                )
              : null,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: AppTheme.spacingLg,
            vertical: AppTheme.spacingMd,
          ),
          filled: true,
          fillColor: AppTheme.backgroundLight,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(AppTheme.radiusMd),
            borderSide: BorderSide.none,
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(AppTheme.radiusMd),
            borderSide: BorderSide.none,
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(AppTheme.radiusMd),
            borderSide: BorderSide.none,
          ),
        ),
      ),
    );
  }

  // ── Category Navigation ───────────────────────────────────────
  Widget _buildCategoryNav() {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppTheme.spacingLg,
        vertical: AppTheme.spacingMd,
      ),
      color: AppTheme.backgroundWhite,
      child: Row(
        children: _categories.map((cat) {
          final isSelected = cat == _selectedCategory;
          final isAll = cat == '全部';
          final icon = isAll ? Icons.grid_view_rounded : KnowledgeMockData.categoryIcons[cat];
          final color = isAll
              ? AppTheme.brandBlue
              : KnowledgeMockData.categoryColors[cat] ?? AppTheme.brandBlue;

          return Expanded(
            child: GestureDetector(
              onTap: () => _onCategoryChanged(cat),
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 3),
                padding: const EdgeInsets.symmetric(vertical: AppTheme.spacingSm),
                decoration: BoxDecoration(
                  color: isSelected ? color.withValues(alpha: 0.1) : AppTheme.backgroundLight,
                  borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                  border: isSelected
                      ? Border.all(color: color.withValues(alpha: 0.3), width: 1)
                      : null,
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      icon,
                      size: 20,
                      color: isSelected ? color : AppTheme.textSecondary,
                    ),
                    const SizedBox(height: AppTheme.spacingXs),
                    Text(
                      cat,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                        color: isSelected ? color : AppTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  // ── Article List ──────────────────────────────────────────────
  Widget _buildArticleList() {
    if (_filteredArticles.isEmpty) {
      return const EmptyState(
        icon: Icons.menu_book_rounded,
        title: '暂无文章',
        subtitle: '当前筛选条件下没有匹配的文章',
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: AppTheme.spacingSm),
      itemCount: _filteredArticles.length,
      itemBuilder: (context, index) => _buildArticleCard(_filteredArticles[index]),
    );
  }

  Widget _buildArticleCard(KnowledgeArticle article) {
    final categoryColor =
        KnowledgeMockData.categoryColors[article.category] ?? AppTheme.brandBlue;

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => _ArticleDetailPage(article: article),
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.symmetric(
          horizontal: AppTheme.spacingLg,
          vertical: AppTheme.spacingSm,
        ),
        padding: const EdgeInsets.all(AppTheme.spacingLg),
        decoration: BoxDecoration(
          color: AppTheme.backgroundWhite,
          borderRadius: BorderRadius.circular(AppTheme.radiusLg),
          border: Border.all(color: AppTheme.border, width: 0.5),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Row 1: Category tag + view count ──────────────
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppTheme.spacingSm,
                    vertical: AppTheme.spacingXxs,
                  ),
                  decoration: BoxDecoration(
                    color: categoryColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                  ),
                  child: Text(
                    article.category,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: categoryColor,
                    ),
                  ),
                ),
                const Spacer(),
                Icon(Icons.remove_red_eye_outlined, size: 14, color: AppTheme.textHint),
                const SizedBox(width: AppTheme.spacingXs),
                Text('${article.viewCount}', style: AppTheme.caption),
              ],
            ),
            const SizedBox(height: AppTheme.spacingSm),
            // ── Row 2: Title ──────────────────────────────────
            Text(
              article.title,
              style: AppTheme.titleMedium,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: AppTheme.spacingXs),
            // ── Row 3: Summary ────────────────────────────────
            Text(
              article.summary,
              style: AppTheme.bodySmall,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: AppTheme.spacingSm),
            // ── Row 4: Updated time ───────────────────────────
            Row(
              children: [
                const Icon(Icons.access_time_rounded, size: 12, color: AppTheme.textHint),
                const SizedBox(width: AppTheme.spacingXs),
                Text(
                  '更新于 ${article.updatedAt.year}-${article.updatedAt.month.toString().padLeft(2, '0')}-${article.updatedAt.day.toString().padLeft(2, '0')}',
                  style: AppTheme.caption,
                ),
                const Spacer(),
                Icon(Icons.chevron_right_rounded, color: AppTheme.textHint, size: 18),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────
// Article Detail Page
// ──────────────────────────────────────────────────────────────

class _ArticleDetailPage extends StatelessWidget {
  final KnowledgeArticle article;

  const _ArticleDetailPage({required this.article});

  @override
  Widget build(BuildContext context) {
    final categoryColor =
        KnowledgeMockData.categoryColors[article.category] ?? AppTheme.brandBlue;

    return Scaffold(
      backgroundColor: AppTheme.backgroundWhite,
      appBar: AppBar(
        title: const Text('文章详情'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('已收藏')),
              );
            },
            icon: const Icon(Icons.bookmark_border_rounded),
          ),
          IconButton(
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('分享功能开发中')),
              );
            },
            icon: const Icon(Icons.share_rounded),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppTheme.spacingXl),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Category tag ───────────────────────────────────
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: AppTheme.spacingSm,
                vertical: AppTheme.spacingXxs,
              ),
              decoration: BoxDecoration(
                color: categoryColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(AppTheme.radiusSm),
              ),
              child: Text(
                article.category,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: categoryColor,
                ),
              ),
            ),
            const SizedBox(height: AppTheme.spacingMd),
            // ── Title ──────────────────────────────────────────
            Text(article.title, style: AppTheme.headingMedium),
            const SizedBox(height: AppTheme.spacingSm),
            // ── Meta info ──────────────────────────────────────
            Row(
              children: [
                const Icon(Icons.access_time_rounded, size: 14, color: AppTheme.textHint),
                const SizedBox(width: AppTheme.spacingXs),
                Text(
                  '${article.updatedAt.year}-${article.updatedAt.month.toString().padLeft(2, '0')}-${article.updatedAt.day.toString().padLeft(2, '0')} 更新',
                  style: AppTheme.bodySmall,
                ),
                const SizedBox(width: AppTheme.spacingLg),
                Icon(Icons.remove_red_eye_outlined, size: 14, color: AppTheme.textHint),
                const SizedBox(width: AppTheme.spacingXs),
                Text('${article.viewCount} 次阅读', style: AppTheme.bodySmall),
              ],
            ),
            const SizedBox(height: AppTheme.spacingXl),
            const Divider(),
            const SizedBox(height: AppTheme.spacingLg),
            // ── Content (rich text simulation) ─────────────────
            _buildRichContent(article.content),
          ],
        ),
      ),
    );
  }

  Widget _buildRichContent(String content) {
    final lines = content.split('\n');
    final widgets = <Widget>[];

    for (final line in lines) {
      if (line.startsWith('# ')) {
        widgets.add(Padding(
          padding: const EdgeInsets.only(top: AppTheme.spacingLg, bottom: AppTheme.spacingSm),
          child: Text(
            line.substring(2),
            style: AppTheme.headingMedium,
          ),
        ));
      } else if (line.startsWith('## ')) {
        widgets.add(Padding(
          padding: const EdgeInsets.only(top: AppTheme.spacingXl, bottom: AppTheme.spacingSm),
          child: Text(
            line.substring(3),
            style: AppTheme.titleLarge,
          ),
        ));
      } else if (line.startsWith('### ')) {
        widgets.add(Padding(
          padding: const EdgeInsets.only(top: AppTheme.spacingLg, bottom: AppTheme.spacingXs),
          child: Text(
            line.substring(4),
            style: AppTheme.titleMedium,
          ),
        ));
      } else if (line.startsWith('| ')) {
        // Table row — render as simple text
        widgets.add(Padding(
          padding: const EdgeInsets.symmetric(vertical: AppTheme.spacingXxs),
          child: Text(
            line,
            style: AppTheme.bodySmall.copyWith(fontFamily: 'monospace'),
          ),
        ));
      } else if (line.startsWith('- [ ] ') || line.startsWith('- [x] ')) {
        final checked = line.startsWith('- [x] ');
        final text = line.substring(6);
        widgets.add(Padding(
          padding: const EdgeInsets.symmetric(vertical: 2),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                checked ? Icons.check_box_rounded : Icons.check_box_outline_blank,
                size: 18,
                color: checked ? AppTheme.success : AppTheme.textSecondary,
              ),
              const SizedBox(width: AppTheme.spacingSm),
              Expanded(
                child: Text(text, style: AppTheme.bodyMedium),
              ),
            ],
          ),
        ));
      } else if (line.startsWith('- ')) {
        widgets.add(Padding(
          padding: const EdgeInsets.symmetric(vertical: 2),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('  •  ', style: AppTheme.bodyMedium),
              Expanded(
                child: Text(line.substring(2), style: AppTheme.bodyMedium),
              ),
            ],
          ),
        ));
      } else if (line.startsWith('**') && line.endsWith('**')) {
        widgets.add(Padding(
          padding: const EdgeInsets.only(top: AppTheme.spacingSm),
          child: Text(
            line.replaceAll('**', ''),
            style: AppTheme.bodyMedium.copyWith(fontWeight: FontWeight.w600),
          ),
        ));
      } else if (line.trim().isEmpty) {
        widgets.add(const SizedBox(height: AppTheme.spacingSm));
      } else {
        widgets.add(Padding(
          padding: const EdgeInsets.only(bottom: AppTheme.spacingXs),
          child: Text(line, style: AppTheme.bodyMedium),
        ));
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: widgets,
    );
  }
}
