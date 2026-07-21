import 'package:dio/dio.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'package:ops_flutter/core/network/api_client.dart';
import 'package:ops_flutter/core/network/api_endpoints.dart';
import 'package:ops_flutter/core/theme/app_theme.dart';
import 'package:ops_flutter/shared/widgets/common_widgets.dart';

/// Work order statistics page with KPI cards, charts, and ranking.
class WorkOrderStatsPage extends StatefulWidget {
  const WorkOrderStatsPage({super.key});

  @override
  State<WorkOrderStatsPage> createState() => _WorkOrderStatsPageState();
}

class _WorkOrderStatsPageState extends State<WorkOrderStatsPage> {
  // ── State ────────────────────────────────────────────────────
  bool _isLoading = true;
  String? _errorMessage;

  // ── KPI data ─────────────────────────────────────────────────
  int _totalOrders = 0;
  double _completionRate = 0.0;
  String _avgProcessTime = '--';

  // ── Pie chart data (type distribution) ───────────────────────
  List<_PieData> _typeDistribution = [];

  // ── Bar chart data (7-day trend) ─────────────────────────────
  List<_BarData> _trendData = [];

  // ── Ranking data ─────────────────────────────────────────────
  List<_RankingItem> _rankingList = [];

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await ApiClient.instance.get(
        ApiEndpoints.workOrderStatistics,
      );
      final data = response.data as Map<String, dynamic>?;
      if (data != null) {
        setState(() {
          _totalOrders = data['totalOrders'] as int? ?? 0;
          _completionRate = (data['completionRate'] as num?)?.toDouble() ?? 0.0;
          _avgProcessTime = data['avgProcessTime']?.toString() ?? '--';

          // Type distribution
          _typeDistribution = (data['typeDistribution'] as List<dynamic>?)
                  ?.map((e) => _PieData.fromJson(e as Map<String, dynamic>))
                  .toList() ??
              [];

          // 7-day trend
          _trendData = (data['trend'] as List<dynamic>?)
                  ?.map((e) => _BarData.fromJson(e as Map<String, dynamic>))
                  .toList() ??
              [];

          // Ranking
          _rankingList = (data['ranking'] as List<dynamic>?)
                  ?.map((e) => _RankingItem.fromJson(e as Map<String, dynamic>))
                  .toList() ??
              [];
        });
      }
    } on DioException catch (e) {
      setState(() {
        _errorMessage = e.message ?? '加载统计失败';
      });
    } catch (e) {
      setState(() {
        _errorMessage = '加载统计数据失败';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        title: const Text('工单统计'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 20),
          onPressed: () => context.pop(),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, size: 22),
            onPressed: _loadStats,
          ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const LoadingIndicator(message: '加载统计数据...');
    }

    if (_errorMessage != null) {
      return ErrorRetryWidget(
        message: _errorMessage!,
        onRetry: _loadStats,
      );
    }

    return RefreshIndicator(
      onRefresh: _loadStats,
      child: ListView(
        padding: const EdgeInsets.all(AppTheme.spacingLg),
        children: [
          // ── KPI Cards ───────────────────────────────────────
          _buildKpiCards(),
          const SizedBox(height: AppTheme.spacingLg),
          // ── Pie Chart (type distribution) ────────────────────
          _buildTypeDistributionChart(),
          const SizedBox(height: AppTheme.spacingLg),
          // ── Bar Chart (7-day trend) ──────────────────────────
          _buildTrendChart(),
          const SizedBox(height: AppTheme.spacingLg),
          // ── Efficiency Ranking ───────────────────────────────
          _buildRankingList(),
          const SizedBox(height: AppTheme.spacingXl),
        ],
      ),
    );
  }

  // ── KPI Cards ────────────────────────────────────────────────
  Widget _buildKpiCards() {
    return Row(
      children: [
        Expanded(
          child: _KpiCard(
            title: '总工单',
            value: _totalOrders.toString(),
            icon: Icons.assignment_rounded,
            color: AppTheme.brandBlue,
          ),
        ),
        const SizedBox(width: AppTheme.spacingSm),
        Expanded(
          child: _KpiCard(
            title: '完成率',
            value: '${(_completionRate * 100).toStringAsFixed(1)}%',
            icon: Icons.check_circle_outline,
            color: AppTheme.success,
          ),
        ),
        const SizedBox(width: AppTheme.spacingSm),
        Expanded(
          child: _KpiCard(
            title: '平均处理',
            value: _avgProcessTime,
            icon: Icons.schedule_rounded,
            color: AppTheme.warning,
          ),
        ),
      ],
    );
  }

  // ── Pie Chart (Type Distribution) ────────────────────────────
  Widget _buildTypeDistributionChart() {
    if (_typeDistribution.isEmpty) {
      return _buildEmptyChartCard('类型分布', '暂无数据');
    }

    return Container(
      padding: const EdgeInsets.all(AppTheme.spacingLg),
      decoration: BoxDecoration(
        color: AppTheme.backgroundWhite,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        border: Border.all(color: AppTheme.border, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('类型分布', style: AppTheme.titleMedium),
          const SizedBox(height: AppTheme.spacingLg),
          SizedBox(
            height: 200,
            child: PieChart(
              PieChartData(
                sectionsSpace: 2,
                centerSpaceRadius: 40,
                sections: _typeDistribution.asMap().entries.map((entry) {
                  final index = entry.key;
                  final item = entry.value;
                  return PieChartSectionData(
                    value: item.value.toDouble(),
                    title: '${item.value}',
                    color: _pieColors[index % _pieColors.length],
                    radius: 60,
                    titleStyle: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
          const SizedBox(height: AppTheme.spacingLg),
          // Legend
          Wrap(
            spacing: AppTheme.spacingLg,
            runSpacing: AppTheme.spacingSm,
            children: _typeDistribution.asMap().entries.map((entry) {
              final index = entry.key;
              final item = entry.value;
              return Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 12,
                    height: 12,
                    decoration: BoxDecoration(
                      color: _pieColors[index % _pieColors.length],
                      borderRadius: BorderRadius.circular(3),
                    ),
                  ),
                  const SizedBox(width: AppTheme.spacingXs),
                  Text(
                    '${item.label} (${item.value})',
                    style: AppTheme.bodySmall,
                  ),
                ],
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  static const List<Color> _pieColors = [
    AppTheme.brandBlue,
    AppTheme.success,
    AppTheme.warning,
    AppTheme.error,
    Color(0xFF722ED1),
    Color(0xFF13C2C2),
  ];

  // ── Bar Chart (7-Day Trend) ──────────────────────────────────
  Widget _buildTrendChart() {
    if (_trendData.isEmpty) {
      return _buildEmptyChartCard('7天趋势', '暂无数据');
    }

    final maxY = _trendData
        .map((e) => e.count)
        .fold<int>(0, (a, b) => a > b ? a : b)
        .toDouble();

    return Container(
      padding: const EdgeInsets.all(AppTheme.spacingLg),
      decoration: BoxDecoration(
        color: AppTheme.backgroundWhite,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        border: Border.all(color: AppTheme.border, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('7天趋势', style: AppTheme.titleMedium),
          const SizedBox(height: AppTheme.spacingLg),
          SizedBox(
            height: 200,
            child: BarChart(
              BarChartData(
                alignment: BarChartAlignment.spaceAround,
                maxY: (maxY * 1.2).ceilToDouble(),
                minY: 0,
                barTouchData: BarTouchData(
                  touchTooltipData: BarTouchTooltipData(
                    getTooltipItem: (group, groupIndex, rod, rodIndex) {
                      return BarTooltipItem(
                        '${_trendData[groupIndex].date}\n${rod.toY.toInt()} 单',
                        const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      );
                    },
                  ),
                ),
                titlesData: FlTitlesData(
                  show: true,
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 30,
                      getTitlesWidget: (value, meta) {
                        final index = value.toInt();
                        if (index >= 0 && index < _trendData.length) {
                          final dateStr = _trendData[index].date;
                          // Show MM-dd format
                          final shortDate = dateStr.length >= 5
                              ? dateStr.substring(dateStr.length - 5)
                              : dateStr;
                          return SideTitleWidget(
                            meta: meta,
                            child: Text(
                              shortDate,
                              style: AppTheme.caption,
                            ),
                          );
                        }
                        return const SizedBox.shrink();
                      },
                    ),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 30,
                      getTitlesWidget: (value, meta) {
                        if (value == value.roundToDouble()) {
                          return Text(
                            value.toInt().toString(),
                            style: AppTheme.caption,
                          );
                        }
                        return const SizedBox.shrink();
                      },
                    ),
                  ),
                  topTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                ),
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  horizontalInterval: (maxY / 4).ceilToDouble().clamp(1, double.infinity),
                  getDrawingHorizontalLine: (value) => FlLine(
                    color: AppTheme.divider,
                    strokeWidth: 0.5,
                  ),
                ),
                borderData: FlBorderData(show: false),
                barGroups: _trendData.asMap().entries.map((entry) {
                  final index = entry.key;
                  final item = entry.value;
                  return BarChartGroupData(
                    x: index,
                    barRods: [
                      BarChartRodData(
                        toY: item.count.toDouble(),
                        color: AppTheme.brandBlue,
                        width: 20,
                        borderRadius: const BorderRadius.only(
                          topLeft: Radius.circular(4),
                          topRight: Radius.circular(4),
                        ),
                      ),
                    ],
                  );
                }).toList(),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Ranking List ─────────────────────────────────────────────
  Widget _buildRankingList() {
    return Container(
      padding: const EdgeInsets.all(AppTheme.spacingLg),
      decoration: BoxDecoration(
        color: AppTheme.backgroundWhite,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        border: Border.all(color: AppTheme.border, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('效率排名', style: AppTheme.titleMedium),
          const SizedBox(height: AppTheme.spacingMd),
          if (_rankingList.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: AppTheme.spacingXl),
              child: Center(
                child: Text('暂无排名数据', style: AppTheme.bodySmall),
              ),
            )
          else
            ..._rankingList.asMap().entries.map((entry) {
              final index = entry.key;
              final item = entry.value;
              return _RankingTile(
                rank: index + 1,
                item: item,
              );
            }),
        ],
      ),
    );
  }

  // ── Empty chart placeholder ──────────────────────────────────
  Widget _buildEmptyChartCard(String title, String message) {
    return Container(
      padding: const EdgeInsets.all(AppTheme.spacingLg),
      decoration: BoxDecoration(
        color: AppTheme.backgroundWhite,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        border: Border.all(color: AppTheme.border, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: AppTheme.titleMedium),
          const SizedBox(height: AppTheme.spacingXl),
          Center(
            child: Padding(
              padding: const EdgeInsets.all(AppTheme.spacingXl),
              child: Column(
                children: [
                  const Icon(
                    Icons.bar_chart_rounded,
                    size: 48,
                    color: AppTheme.textHint,
                  ),
                  const SizedBox(height: AppTheme.spacingSm),
                  Text(message, style: AppTheme.bodySmall),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────
// KPI Card
// ──────────────────────────────────────────────────────────────

class _KpiCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const _KpiCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppTheme.spacingMd),
      decoration: BoxDecoration(
        color: AppTheme.backgroundWhite,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        border: Border.all(color: AppTheme.border, width: 0.5),
      ),
      child: Column(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(AppTheme.radiusMd),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(height: AppTheme.spacingSm),
          Text(
            value,
            style: AppTheme.numberMedium.copyWith(color: color),
          ),
          const SizedBox(height: AppTheme.spacingXxs),
          Text(title, style: AppTheme.caption),
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────
// Ranking Tile
// ──────────────────────────────────────────────────────────────

class _RankingTile extends StatelessWidget {
  final int rank;
  final _RankingItem item;

  const _RankingTile({required this.rank, required this.item});

  Color get _rankColor {
    if (rank == 1) return const Color(0xFFFFD700); // Gold
    if (rank == 2) return const Color(0xFFC0C0C0); // Silver
    if (rank == 3) return const Color(0xFFCD7F32); // Bronze
    return AppTheme.textSecondary;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppTheme.spacingMd,
        vertical: AppTheme.spacingSm,
      ),
      margin: const EdgeInsets.only(bottom: AppTheme.spacingXs),
      decoration: BoxDecoration(
        color: rank <= 3 ? _rankColor.withValues(alpha: 0.05) : null,
        borderRadius: BorderRadius.circular(AppTheme.radiusMd),
      ),
      child: Row(
        children: [
          // ── Rank badge ────────────────────────────────────
          SizedBox(
            width: 28,
            child: Center(
              child: rank <= 3
                  ? Icon(Icons.emoji_events_rounded, color: _rankColor, size: 20)
                  : Text(
                      '$rank',
                      style: AppTheme.numberSmall.copyWith(color: _rankColor),
                    ),
            ),
          ),
          const SizedBox(width: AppTheme.spacingMd),
          // ── Avatar ────────────────────────────────────────
          CircleAvatar(
            radius: 16,
            backgroundColor: AppTheme.brandBlue.withValues(alpha: 0.1),
            child: Text(
              item.name.isNotEmpty ? item.name[0] : '?',
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppTheme.brandBlue,
              ),
            ),
          ),
          const SizedBox(width: AppTheme.spacingMd),
          // ── Name + stats ──────────────────────────────────
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.name,
                  style: AppTheme.bodyMedium.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  '完成 ${item.completedCount} 单 | 平均 ${item.avgTime}',
                  style: AppTheme.caption,
                ),
              ],
            ),
          ),
          // ── Completion rate ───────────────────────────────
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: AppTheme.spacingSm,
              vertical: AppTheme.spacingXxs,
            ),
            decoration: BoxDecoration(
              color: AppTheme.success.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(AppTheme.radiusSm),
            ),
            child: Text(
              '${(item.completionRate * 100).toStringAsFixed(0)}%',
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppTheme.success,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────
// Data Models (internal)
// ──────────────────────────────────────────────────────────────

class _PieData {
  final String label;
  final int value;

  const _PieData({required this.label, required this.value});

  factory _PieData.fromJson(Map<String, dynamic> json) {
    return _PieData(
      label: json['label']?.toString() ?? '',
      value: json['value'] as int? ?? 0,
    );
  }
}

class _BarData {
  final String date;
  final int count;

  const _BarData({required this.date, required this.count});

  factory _BarData.fromJson(Map<String, dynamic> json) {
    return _BarData(
      date: json['date']?.toString() ?? '',
      count: json['count'] as int? ?? 0,
    );
  }
}

class _RankingItem {
  final String name;
  final int completedCount;
  final String avgTime;
  final double completionRate;

  const _RankingItem({
    required this.name,
    required this.completedCount,
    required this.avgTime,
    required this.completionRate,
  });

  factory _RankingItem.fromJson(Map<String, dynamic> json) {
    return _RankingItem(
      name: json['name']?.toString() ?? '',
      completedCount: json['completedCount'] as int? ?? 0,
      avgTime: json['avgTime']?.toString() ?? '--',
      completionRate: (json['completionRate'] as num?)?.toDouble() ?? 0.0,
    );
  }
}
