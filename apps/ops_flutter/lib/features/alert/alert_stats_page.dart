import 'package:dio/dio.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'package:ops_flutter/core/network/api_client.dart';
import 'package:ops_flutter/core/network/api_endpoints.dart';
import 'package:ops_flutter/core/theme/app_theme.dart';
import 'package:ops_flutter/features/alert/models/alert_models.dart';
import 'package:ops_flutter/shared/widgets/common_widgets.dart';

/// Alert statistics page with overview cards, trend line chart, and type pie chart.
class AlertStatsPage extends StatefulWidget {
  const AlertStatsPage({super.key});

  @override
  State<AlertStatsPage> createState() => _AlertStatsPageState();
}

class _AlertStatsPageState extends State<AlertStatsPage> {
  AlertStats? _stats;
  bool _isLoading = true;
  String? _errorMessage;

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
        ApiEndpoints.alertStatistics,
      );
      final data = response.data;
      if (data != null && data is Map<String, dynamic>) {
        setState(() {
          _stats = AlertStats.fromJson(data);
        });
      }
    } on DioException catch (e) {
      setState(() {
        _errorMessage = e.message ?? '网络请求失败';
      });
    } catch (e) {
      setState(() {
        _errorMessage = '加载失败，请重试';
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
        title: const Text('告警统计'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 20),
          onPressed: () => context.pop(),
        ),
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

    if (_stats == null) {
      return const EmptyState(
        icon: Icons.bar_chart_rounded,
        title: '暂无统计数据',
      );
    }

    return RefreshIndicator(
      onRefresh: _loadStats,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(AppTheme.spacingLg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Overview cards ───────────────────────────────
            _buildOverviewCards(),
            const SizedBox(height: AppTheme.spacingLg),

            // ── Trend line chart ─────────────────────────────
            if (_stats!.trend.isNotEmpty) ...[
              _buildSectionTitle('告警趋势（近7天）'),
              const SizedBox(height: AppTheme.spacingSm),
              _buildTrendChart(),
              const SizedBox(height: AppTheme.spacingLg),
            ],

            // ── Type distribution pie chart ──────────────────
            if (_stats!.typeDistribution.isNotEmpty) ...[
              _buildSectionTitle('告警类型分布'),
              const SizedBox(height: AppTheme.spacingSm),
              _buildPieChart(),
            ],
          ],
        ),
      ),
    );
  }

  // ── Section title ────────────────────────────────────────────
  Widget _buildSectionTitle(String title) {
    return Row(
      children: [
        Container(
          width: 3,
          height: 16,
          decoration: BoxDecoration(
            color: AppTheme.brandBlue,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: AppTheme.spacingSm),
        Text(title, style: AppTheme.titleMedium),
      ],
    );
  }

  // ── Overview cards (2x3 grid) ────────────────────────────────
  Widget _buildOverviewCards() {
    return GridView.count(
      crossAxisCount: 2,
      mainAxisSpacing: AppTheme.spacingSm,
      crossAxisSpacing: AppTheme.spacingSm,
      childAspectRatio: 2.0,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      children: [
        _StatOverviewCard(
          title: '总告警数',
          value: '${_stats!.totalAlerts}',
          icon: Icons.notifications_active_rounded,
          color: AppTheme.brandBlue,
        ),
        _StatOverviewCard(
          title: '已解决',
          value: '${_stats!.resolvedAlerts}',
          icon: Icons.check_circle_outline_rounded,
          color: AppTheme.success,
        ),
        _StatOverviewCard(
          title: '待处理',
          value: '${_stats!.pendingAlerts}',
          icon: Icons.pending_actions_rounded,
          color: AppTheme.warning,
        ),
        _StatOverviewCard(
          title: '解决率',
          value: '${(_stats!.resolveRate * 100).toStringAsFixed(1)}%',
          icon: Icons.pie_chart_outline_rounded,
          color: AppTheme.brandBlue,
        ),
        _StatOverviewCard(
          title: '平均响应',
          value: _formatMinutes(_stats!.avgResponseMinutes),
          icon: Icons.timer_outlined,
          color: const Color(0xFFFF7A00),
        ),
        _StatOverviewCard(
          title: '平均解决',
          value: _formatMinutes(_stats!.avgResolveMinutes),
          icon: Icons.speed_rounded,
          color: AppTheme.info,
        ),
      ],
    );
  }

  String _formatMinutes(double minutes) {
    if (minutes < 1) return '<1min';
    if (minutes < 60) return '${minutes.toStringAsFixed(0)}min';
    final h = (minutes / 60).floor();
    final m = (minutes % 60).floor();
    return m > 0 ? '${h}h${m}m' : '${h}h';
  }

  // ── Trend line chart ─────────────────────────────────────────
  Widget _buildTrendChart() {
    final trend = _stats!.trend;
    final maxY = trend.fold<int>(0, (max, e) => e.count > max ? e.count : max);

    return Container(
      width: double.infinity,
      height: 220,
      padding: const EdgeInsets.all(AppTheme.spacingLg),
      decoration: BoxDecoration(
        color: AppTheme.backgroundWhite,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        border: Border.all(color: AppTheme.border, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.show_chart_rounded,
                size: 16,
                color: AppTheme.brandBlue,
              ),
              const SizedBox(width: AppTheme.spacingXs),
              Text(
                '告警数量趋势',
                style: AppTheme.bodySmall.copyWith(
                  color: AppTheme.textSecondary,
                ),
              ),
              const Spacer(),
              Text(
                '峰值: $maxY',
                style: AppTheme.numberSmall.copyWith(
                  color: AppTheme.brandBlue,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppTheme.spacingMd),
          Expanded(
            child: LineChart(
              LineChartData(
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  horizontalInterval: maxY > 0 ? (maxY / 4).ceilToDouble() : 1,
                  getDrawingHorizontalLine: (value) {
                    return FlLine(
                      color: AppTheme.border,
                      strokeWidth: 0.5,
                    );
                  },
                ),
                titlesData: FlTitlesData(
                  rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  topTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  leftTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 24,
                      interval: 1,
                      getTitlesWidget: (value, meta) {
                        final index = value.toInt();
                        if (index >= 0 && index < trend.length) {
                          return Padding(
                            padding: const EdgeInsets.only(top: 6),
                            child: Text(
                              trend[index].date,
                              style: AppTheme.caption,
                            ),
                          );
                        }
                        return const SizedBox.shrink();
                      },
                    ),
                  ),
                ),
                borderData: FlBorderData(show: false),
                minX: 0,
                maxX: (trend.length - 1).toDouble(),
                minY: 0,
                maxY: maxY > 0 ? (maxY * 1.2).ceilToDouble() : 10,
                lineBarsData: [
                  LineChartBarData(
                    spots: trend.asMap().entries.map((entry) {
                      return FlSpot(
                        entry.key.toDouble(),
                        entry.value.count.toDouble(),
                      );
                    }).toList(),
                    isCurved: true,
                    color: AppTheme.brandBlue,
                    barWidth: 2.5,
                    isStrokeCapRound: true,
                    dotData: FlDotData(
                      show: true,
                      getDotPainter: (spot, percent, barData, index) {
                        return FlDotCirclePainter(
                          radius: 3,
                          color: AppTheme.brandBlue,
                          strokeWidth: 1.5,
                          strokeColor: AppTheme.backgroundWhite,
                        );
                      },
                    ),
                    belowBarData: BarAreaData(
                      show: true,
                      color: AppTheme.brandBlue.withValues(alpha: 0.08),
                    ),
                  ),
                ],
                lineTouchData: LineTouchData(
                  touchTooltipData: LineTouchTooltipData(
                    getTooltipItems: (touchedSpots) {
                      return touchedSpots.map((spot) {
                        final index = spot.x.toInt();
                        final label =
                            index < trend.length ? trend[index].date : '';
                        return LineTooltipItem(
                          '$label\n${spot.y.toInt()}',
                          const TextStyle(
                            color: AppTheme.textWhite,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        );
                      }).toList();
                    },
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Pie chart ────────────────────────────────────────────────
  Widget _buildPieChart() {
    final distribution = _stats!.typeDistribution;
    final total = distribution.fold<int>(0, (sum, e) => sum + e.count);

    final levelColors = <String, Color>{
      'P0': AppTheme.error,
      'P1': const Color(0xFFFF7A00),
      'P2': AppTheme.warning,
      'P3': AppTheme.info,
    };

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppTheme.spacingLg),
      decoration: BoxDecoration(
        color: AppTheme.backgroundWhite,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        border: Border.all(color: AppTheme.border, width: 0.5),
      ),
      child: Column(
        children: [
          SizedBox(
            height: 200,
            child: PieChart(
              PieChartData(
                sectionsSpace: 2,
                centerSpaceRadius: 40,
                sections: distribution.map((item) {
                  final color = levelColors[item.level] ?? AppTheme.textSecondary;
                  final percentage =
                      total > 0 ? (item.count / total * 100) : 0.0;

                  return PieChartSectionData(
                    value: item.count.toDouble(),
                    color: color,
                    radius: 60,
                    title: '${percentage.toStringAsFixed(1)}%',
                    titleStyle: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textWhite,
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
            children: distribution.map((item) {
              final color = levelColors[item.level] ?? AppTheme.textSecondary;
              return Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 12,
                    height: 12,
                    decoration: BoxDecoration(
                      color: color,
                      borderRadius: BorderRadius.circular(3),
                    ),
                  ),
                  const SizedBox(width: AppTheme.spacingXs),
                  Text(
                    '${item.level} (${item.count})',
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
}

// ──────────────────────────────────────────────────────────────
// Stat Overview Card
// ──────────────────────────────────────────────────────────────

class _StatOverviewCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const _StatOverviewCard({
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
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                ),
                child: Icon(icon, size: 18, color: color),
              ),
              const Spacer(),
              Text(
                value,
                style: AppTheme.numberMedium.copyWith(color: color),
              ),
            ],
          ),
          const SizedBox(height: AppTheme.spacingSm),
          Text(
            title,
            style: AppTheme.bodySmall,
          ),
        ],
      ),
    );
  }
}
