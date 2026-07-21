import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import 'package:ops_flutter/core/network/api_client.dart';
import 'package:ops_flutter/core/network/api_endpoints.dart';
import 'package:ops_flutter/core/providers/auth_provider.dart';
import 'package:ops_flutter/core/router/app_router.dart';
import 'package:ops_flutter/core/theme/app_theme.dart';
import 'package:ops_flutter/shared/models/alert_item.dart';
import 'package:ops_flutter/shared/models/ops_stats.dart';

/// Ops dashboard home page.
class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  OpsStats? _stats;
  List<AlertItem> _recentAlerts = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final results = await Future.wait([
        _fetchStats(),
        _fetchRecentAlerts(),
      ]);

      if (mounted) {
        setState(() {
          _stats = results[0] as OpsStats?;
          _recentAlerts = (results[1] as List<AlertItem>?) ?? [];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = '加载失败，请下拉刷新重试';
          _isLoading = false;
        });
      }
    }
  }

  Future<OpsStats?> _fetchStats() async {
    try {
      final resp = await ApiClient.instance.get(ApiEndpoints.dashboardOverview);
      if (resp.data is Map<String, dynamic>) {
        return OpsStats.fromJson(resp.data as Map<String, dynamic>);
      }
    } catch (_) {
      // Fallback to zero stats on error.
    }
    return null;
  }

  Future<List<AlertItem>> _fetchRecentAlerts() async {
    try {
      final resp = await ApiClient.instance.get(
        ApiEndpoints.alerts,
        queryParameters: {'page': 1, 'size': 3, 'status': 'PENDING'},
      );
      final data = resp.data;
      if (data is Map<String, dynamic>) {
        final records = data['list'] as List<dynamic>?;
        if (records != null) {
          return records
              .map((e) => AlertItem.fromJson(e as Map<String, dynamic>))
              .toList();
        }
      }
    } catch (_) {
      // Fallback to empty list on error.
    }
    return [];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.brandBlue))
          : _error != null
              ? _buildErrorState()
              : _buildContent(),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppTheme.spacingXxl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cloud_off_rounded, size: 64, color: AppTheme.textHint),
            const SizedBox(height: AppTheme.spacingLg),
            Text(_error!, style: AppTheme.bodyMedium.copyWith(color: AppTheme.textSecondary)),
            const SizedBox(height: AppTheme.spacingXl),
            OutlinedButton.icon(
              onPressed: _loadData,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('重试'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent() {
    return RefreshIndicator(
      onRefresh: _loadData,
      color: AppTheme.brandBlue,
      child: CustomScrollView(
        slivers: [
          // ── Gradient Header with Greeting ────────────────────
          SliverToBoxAdapter(child: _buildHeader()),

          // ── Stats Grid ───────────────────────────────────────
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: AppTheme.spacingLg),
            sliver: SliverToBoxAdapter(child: _buildStatsGrid()),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: AppTheme.spacingLg)),

          // ── Quick Actions ────────────────────────────────────
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: AppTheme.spacingLg),
            sliver: SliverToBoxAdapter(child: _buildQuickActions()),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: AppTheme.spacingLg)),

          // ── Recent Alerts ────────────────────────────────────
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: AppTheme.spacingLg),
            sliver: SliverToBoxAdapter(child: _buildRecentAlerts()),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: AppTheme.spacingXxl)),
        ],
      ),
    );
  }

  // ── Header ─────────────────────────────────────────────────

  Widget _buildHeader() {
    final auth = context.watch<AuthProvider>();
    final displayName = auth.displayName;
    final now = DateTime.now();
    final dateStr = DateFormat('yyyy年M月d日 EEEE', 'zh_CN').format(now);
    final hour = now.hour;
    final greeting = hour < 6
        ? '凌晨好'
        : hour < 12
            ? '上午好'
            : hour < 14
                ? '中午好'
                : hour < 18
                    ? '下午好'
                    : '晚上好';

    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppTheme.brandBlueDark,
            AppTheme.brandBlue,
            AppTheme.brandBlueLight,
          ],
        ),
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(
            AppTheme.spacingLg,
            AppTheme.spacingLg,
            AppTheme.spacingLg,
            AppTheme.spacingXl + 16, // overlap into content area
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  // Avatar placeholder
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: const Icon(
                      Icons.person_rounded,
                      color: Colors.white,
                      size: 28,
                    ),
                  ),
                  const SizedBox(width: AppTheme.spacingMd),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '$greeting, $displayName',
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: AppTheme.spacingXs),
                        Text(
                          dateStr,
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.white.withOpacity(0.8),
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Notification bell
                  IconButton(
                    onPressed: () => context.push(RoutePaths.messages),
                    icon: const Icon(
                      Icons.notifications_none_rounded,
                      color: Colors.white,
                      size: 24,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── Stats Grid ─────────────────────────────────────────────

  Widget _buildStatsGrid() {
    final stats = _stats ?? const OpsStats();

    final items = [
      _StatItem(
        label: '在线设备',
        value: stats.onlineDeviceCount,
        icon: Icons.devices_rounded,
        color: AppTheme.brandBlue,
      ),
      _StatItem(
        label: '充电站',
        value: stats.stationCount,
        icon: Icons.ev_station_rounded,
        color: AppTheme.success,
      ),
      _StatItem(
        label: '今日订单',
        value: stats.todayOrderCount,
        icon: Icons.receipt_long_rounded,
        color: AppTheme.warning,
      ),
      _StatItem(
        label: '今日电量(度)',
        value: (stats.todayEnergy / 1000).round(),
        icon: Icons.bolt_rounded,
        color: AppTheme.brandBlue,
      ),
    ];

    return Transform.translate(
      offset: const Offset(0, -16),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(AppTheme.radiusLg),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.06),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        padding: const EdgeInsets.all(AppTheme.spacingMd),
        child: GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: AppTheme.spacingMd,
          crossAxisSpacing: AppTheme.spacingMd,
          childAspectRatio: 1.8,
          children: items.map((item) => _buildStatCard(item)).toList(),
        ),
      ),
    );
  }

  Widget _buildStatCard(_StatItem item) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppTheme.spacingMd,
        vertical: AppTheme.spacingSm,
      ),
      decoration: BoxDecoration(
        color: item.color.withOpacity(0.06),
        borderRadius: BorderRadius.circular(AppTheme.radiusMd),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: item.color.withOpacity(0.12),
              borderRadius: BorderRadius.circular(AppTheme.radiusMd),
            ),
            child: Icon(item.icon, color: item.color, size: 22),
          ),
          const SizedBox(width: AppTheme.spacingSm),
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.label,
                  style: AppTheme.caption.copyWith(color: AppTheme.textSecondary),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  '${item.value}',
                  style: AppTheme.numberLarge.copyWith(
                    color: AppTheme.textPrimary,
                    fontSize: 22,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── Quick Actions ──────────────────────────────────────────

  Widget _buildQuickActions() {
    final actions = [
      _ActionItem(icon: Icons.qr_code_scanner_rounded, label: '扫码', route: RoutePaths.scanQr),
      _ActionItem(icon: Icons.warning_amber_rounded, label: '告警处理', route: RoutePaths.alerts),
      _ActionItem(icon: Icons.assignment_rounded, label: '工单管理', route: RoutePaths.workOrders),
      _ActionItem(icon: Icons.checklist_rounded, label: '巡检任务', route: RoutePaths.inspectionList),
      _ActionItem(icon: Icons.power_settings_new_rounded, label: '远程控制', route: RoutePaths.remoteControl),
      _ActionItem(icon: Icons.inventory_2_outlined, label: '备件管理', route: RoutePaths.spareParts),
      _ActionItem(icon: Icons.menu_book_rounded, label: '知识库', route: RoutePaths.knowledge),
      _ActionItem(icon: Icons.swap_horiz_rounded, label: '交接班', route: RoutePaths.shiftHandover),
    ];

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.symmetric(
        horizontal: AppTheme.spacingMd,
        vertical: AppTheme.spacingLg,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(left: AppTheme.spacingXs),
            child: Text('快捷操作', style: AppTheme.titleMedium),
          ),
          const SizedBox(height: AppTheme.spacingMd),
          GridView.count(
            crossAxisCount: 4,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: AppTheme.spacingMd,
            crossAxisSpacing: AppTheme.spacingSm,
            childAspectRatio: 0.85,
            children: actions.map((action) => _buildActionItem(action)).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildActionItem(_ActionItem action) {
    return GestureDetector(
      onTap: () {
        if (action.route != null) {
          context.push(action.route!);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('功能开发中...')),
          );
        }
      },
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppTheme.brandBlue.withOpacity(0.08),
              borderRadius: BorderRadius.circular(AppTheme.radiusMd),
            ),
            child: Icon(action.icon, color: AppTheme.brandBlue, size: 24),
          ),
          const SizedBox(height: AppTheme.spacingXs),
          Text(
            action.label,
            style: AppTheme.bodySmall.copyWith(
              color: AppTheme.textPrimary,
              fontSize: 12,
            ),
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  // ── Recent Alerts ──────────────────────────────────────────

  Widget _buildRecentAlerts() {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.all(AppTheme.spacingLg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('最近告警', style: AppTheme.titleMedium),
              GestureDetector(
                onTap: () => context.push(RoutePaths.alerts),
                child: Text(
                  '查看全部',
                  style: AppTheme.bodySmall.copyWith(color: AppTheme.brandBlue),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppTheme.spacingMd),
          if (_recentAlerts.isEmpty)
            _buildEmptyAlerts()
          else
            ..._recentAlerts.map((alert) => _buildAlertItem(alert)),
        ],
      ),
    );
  }

  Widget _buildEmptyAlerts() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppTheme.spacingXl),
      child: Center(
        child: Column(
          children: [
            Icon(Icons.check_circle_outline_rounded, size: 40, color: AppTheme.success),
            const SizedBox(height: AppTheme.spacingSm),
            Text(
              '暂无待处理告警',
              style: AppTheme.bodySmall.copyWith(color: AppTheme.textSecondary),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAlertItem(AlertItem alert) {
    final levelColor = _alertLevelColor(alert.level);
    final timeStr = _formatTime(alert.createdAt);

    return GestureDetector(
      onTap: () => context.push('/alert/${alert.id}'),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: AppTheme.spacingSm),
        decoration: const BoxDecoration(
          border: Border(bottom: BorderSide(color: AppTheme.divider, width: 0.5)),
        ),
        child: Row(
          children: [
            // Level tag
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: AppTheme.spacingSm,
                vertical: AppTheme.spacingXxs,
              ),
              decoration: BoxDecoration(
                color: levelColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(AppTheme.radiusSm),
              ),
              child: Text(
                alert.level,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: levelColor,
                ),
              ),
            ),
            const SizedBox(width: AppTheme.spacingSm),
            // Alert info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    alert.title,
                    style: AppTheme.bodyMedium.copyWith(
                      color: AppTheme.textPrimary,
                      fontSize: 14,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${alert.stationName} · ${alert.deviceName}',
                    style: AppTheme.caption,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(width: AppTheme.spacingSm),
            Text(timeStr, style: AppTheme.caption),
            const SizedBox(width: AppTheme.spacingXs),
            Icon(Icons.chevron_right_rounded, color: AppTheme.textHint, size: 18),
          ],
        ),
      ),
    );
  }

  // ── Helpers ─────────────────────────────────────────────────

  Color _alertLevelColor(String level) {
    switch (level.toUpperCase()) {
      case 'P0':
        return const Color(0xFFCF1322);
      case 'P1':
        return AppTheme.error;
      case 'P2':
        return AppTheme.warning;
      case 'P3':
      default:
        return AppTheme.info;
    }
  }

  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final diff = now.difference(time);
    if (diff.inMinutes < 1) return '刚刚';
    if (diff.inMinutes < 60) return '${diff.inMinutes}分钟前';
    if (diff.inHours < 24) return '${diff.inHours}小时前';
    if (diff.inDays < 7) return '${diff.inDays}天前';
    return DateFormat('M/d').format(time);
  }
}

// ── Private data classes ──────────────────────────────────────

class _StatItem {
  final String label;
  final int value;
  final IconData icon;
  final Color color;

  const _StatItem({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });
}

class _ActionItem {
  final IconData icon;
  final String label;
  final String? route;

  const _ActionItem({
    required this.icon,
    required this.label,
    this.route,
  });
}
