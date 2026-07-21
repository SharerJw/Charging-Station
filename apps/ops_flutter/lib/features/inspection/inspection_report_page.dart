import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import 'package:ops_flutter/core/network/api_client.dart';
import 'package:ops_flutter/core/network/api_endpoints.dart';
import 'package:ops_flutter/core/theme/app_theme.dart';
import 'package:ops_flutter/features/inspection/inspection_model.dart';
import 'package:ops_flutter/shared/widgets/common_widgets.dart';

/// Inspection report page showing summary, anomalies, and result details.
class InspectionReportPage extends StatefulWidget {
  final String inspectionId;

  const InspectionReportPage({super.key, required this.inspectionId});

  @override
  State<InspectionReportPage> createState() => _InspectionReportPageState();
}

class _InspectionReportPageState extends State<InspectionReportPage> {
  InspectionReport? _report;
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadReport();
  }

  Future<void> _loadReport() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await ApiClient.instance.get(
        '${ApiEndpoints.inspections}/${widget.inspectionId}/report',
      );
      final data = response.data;
      if (data != null && data is Map<String, dynamic>) {
        setState(() {
          _report = InspectionReport.fromJson(data);
        });
      }
    } on DioException catch (e) {
      setState(() {
        _errorMessage = e.message ?? '加载失败';
      });
    } catch (e) {
      setState(() {
        _errorMessage = '加载巡检报告失败';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  // ── Export (placeholder) ──────────────────────────────────────
  void _exportReport() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('导出功能开发中，敬请期待')),
    );
  }

  // ── Build ────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        title: const Text('巡检报告'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 20),
          onPressed: () => context.pop(),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, size: 22),
            onPressed: _loadReport,
          ),
        ],
      ),
      body: _buildBody(),
      bottomNavigationBar: _buildBottomBar(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const LoadingIndicator(message: '加载报告中...');
    }

    if (_errorMessage != null) {
      return ErrorRetryWidget(
        message: _errorMessage!,
        onRetry: _loadReport,
      );
    }

    final report = _report;
    if (report == null) {
      return const EmptyState(
        icon: Icons.error_outline_rounded,
        title: '报告不存在',
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppTheme.spacingLg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Summary card ────────────────────────────────────
          _buildSummaryCard(report),
          const SizedBox(height: AppTheme.spacingLg),

          // ── Statistics card ─────────────────────────────────
          _buildStatisticsCard(report),
          const SizedBox(height: AppTheme.spacingLg),

          // ── Anomalies list ──────────────────────────────────
          if (report.anomalies.isNotEmpty) ...[
            _buildAnomaliesCard(report),
            const SizedBox(height: AppTheme.spacingLg),
          ],

          // ── Result detail table ─────────────────────────────
          _buildResultTable(report),
        ],
      ),
    );
  }

  // ── Summary card ──────────────────────────────────────────────
  Widget _buildSummaryCard(InspectionReport report) {
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
          Row(
            children: [
              const Icon(Icons.assessment_rounded, size: 18, color: AppTheme.brandBlue),
              const SizedBox(width: AppTheme.spacingSm),
              Text('汇总信息', style: AppTheme.titleMedium),
            ],
          ),
          const SizedBox(height: AppTheme.spacingLg),
          _infoRow('任务名称', report.name),
          _infoRow('站点名称', report.stationName),
          _infoRow('巡检人员', report.inspector ?? '--'),
          _infoRow(
            '开始时间',
            report.startTime != null
                ? DateFormat('yyyy-MM-dd HH:mm').format(report.startTime!)
                : '--',
          ),
          _infoRow(
            '完成时间',
            report.completeTime != null
                ? DateFormat('yyyy-MM-dd HH:mm').format(report.completeTime!)
                : '--',
          ),
        ],
      ),
    );
  }

  // ── Statistics card ───────────────────────────────────────────
  Widget _buildStatisticsCard(InspectionReport report) {
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
          Row(
            children: [
              const Icon(Icons.pie_chart_outline_rounded, size: 18, color: AppTheme.brandBlue),
              const SizedBox(width: AppTheme.spacingSm),
              Text('检查统计', style: AppTheme.titleMedium),
            ],
          ),
          const SizedBox(height: AppTheme.spacingLg),
          Row(
            children: [
              Expanded(
                child: _statTile(
                  label: '总项目',
                  value: report.totalItems.toString(),
                  color: AppTheme.brandBlue,
                ),
              ),
              Expanded(
                child: _statTile(
                  label: '通过',
                  value: report.passedItems.toString(),
                  color: AppTheme.success,
                ),
              ),
              Expanded(
                child: _statTile(
                  label: '不通过',
                  value: report.failedItems.toString(),
                  color: AppTheme.error,
                ),
              ),
              Expanded(
                child: _statTile(
                  label: '跳过',
                  value: report.skippedItems.toString(),
                  color: AppTheme.warning,
                ),
              ),
            ],
          ),
          if (report.totalItems > 0) ...[
            const SizedBox(height: AppTheme.spacingLg),
            // Pass rate bar
            Row(
              children: [
                Text('通过率', style: AppTheme.bodySmall),
                const SizedBox(width: AppTheme.spacingSm),
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                    child: LinearProgressIndicator(
                      value: report.passedItems / report.totalItems,
                      minHeight: 8,
                      backgroundColor: AppTheme.backgroundLight,
                      valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.success),
                    ),
                  ),
                ),
                const SizedBox(width: AppTheme.spacingSm),
                Text(
                  '${(report.passedItems / report.totalItems * 100).toStringAsFixed(1)}%',
                  style: AppTheme.numberSmall.copyWith(color: AppTheme.success),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _statTile({
    required String label,
    required String value,
    required Color color,
  }) {
    return Column(
      children: [
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Text(
              value,
              style: AppTheme.numberMedium.copyWith(color: color),
            ),
          ),
        ),
        const SizedBox(height: AppTheme.spacingSm),
        Text(label, style: AppTheme.bodySmall),
      ],
    );
  }

  // ── Anomalies card ────────────────────────────────────────────
  Widget _buildAnomaliesCard(InspectionReport report) {
    return Container(
      padding: const EdgeInsets.all(AppTheme.spacingLg),
      decoration: BoxDecoration(
        color: AppTheme.backgroundWhite,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        border: Border.all(color: AppTheme.error.withValues(alpha: 0.3), width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.warning_amber_rounded, size: 18, color: AppTheme.error),
              const SizedBox(width: AppTheme.spacingSm),
              Text(
                '异常项 (${report.anomalies.length})',
                style: AppTheme.titleMedium.copyWith(color: AppTheme.error),
              ),
            ],
          ),
          const SizedBox(height: AppTheme.spacingMd),
          ...report.anomalies.map((item) => _anomalyItem(item)),
        ],
      ),
    );
  }

  Widget _anomalyItem(InspectionItem item) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppTheme.spacingSm),
      padding: const EdgeInsets.all(AppTheme.spacingMd),
      decoration: BoxDecoration(
        color: AppTheme.error.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(AppTheme.radiusMd),
        border: Border.all(color: AppTheme.error.withValues(alpha: 0.15), width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppTheme.spacingSm,
                  vertical: AppTheme.spacingXs,
                ),
                decoration: BoxDecoration(
                  color: AppTheme.error.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                ),
                child: const Text(
                  '不通过',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.error,
                  ),
                ),
              ),
              const SizedBox(width: AppTheme.spacingSm),
              Expanded(
                child: Text(item.name, style: AppTheme.bodyMedium),
              ),
            ],
          ),
          if (item.note != null && item.note!.isNotEmpty) ...[
            const SizedBox(height: AppTheme.spacingXs),
            Text(
              item.note!,
              style: AppTheme.bodySmall.copyWith(color: AppTheme.textSecondary),
            ),
          ],
          if (item.photos.isNotEmpty) ...[
            const SizedBox(height: AppTheme.spacingSm),
            SizedBox(
              height: 60,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: item.photos.length,
                separatorBuilder: (_, __) => const SizedBox(width: AppTheme.spacingSm),
                itemBuilder: (context, index) {
                  return Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      color: AppTheme.backgroundLight,
                      borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                    ),
                    child: const Icon(
                      Icons.image_outlined,
                      size: 24,
                      color: AppTheme.textHint,
                    ),
                  );
                },
              ),
            ),
          ],
        ],
      ),
    );
  }

  // ── Result detail table ───────────────────────────────────────
  Widget _buildResultTable(InspectionReport report) {
    // Group items by groupName
    final Map<String, List<InspectionItem>> groups = {};
    for (final item in report.allItems) {
      groups.putIfAbsent(item.groupName, () => []);
      groups[item.groupName]!.add(item);
    }

    return Container(
      decoration: BoxDecoration(
        color: AppTheme.backgroundWhite,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        border: Border.all(color: AppTheme.border, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(AppTheme.spacingLg),
            child: Row(
              children: [
                const Icon(Icons.table_chart_rounded, size: 18, color: AppTheme.brandBlue),
                const SizedBox(width: AppTheme.spacingSm),
                Text('结果明细', style: AppTheme.titleMedium),
              ],
            ),
          ),
          // ── Table header ───────────────────────────────────
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: AppTheme.spacingLg,
              vertical: AppTheme.spacingMd,
            ),
            color: AppTheme.backgroundLight,
            child: const Row(
              children: [
                Expanded(
                  flex: 3,
                  child: Text('检查项', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textSecondary)),
                ),
                Expanded(
                  flex: 1,
                  child: Text('结果', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textSecondary)),
                ),
                Expanded(
                  flex: 2,
                  child: Text('备注', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textSecondary)),
                ),
              ],
            ),
          ),
          // ── Table body ─────────────────────────────────────
          ...groups.entries.map((entry) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Group header
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppTheme.spacingLg,
                    vertical: AppTheme.spacingSm,
                  ),
                  color: AppTheme.brandBlue.withValues(alpha: 0.04),
                  child: Text(
                    entry.key,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.brandBlue.withValues(alpha: 0.8),
                    ),
                  ),
                ),
                // Items
                ...entry.value.map((item) => _tableRow(item)),
              ],
            );
          }),
          const SizedBox(height: AppTheme.spacingSm),
        ],
      ),
    );
  }

  Widget _tableRow(InspectionItem item) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppTheme.spacingLg,
        vertical: AppTheme.spacingMd,
      ),
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(color: AppTheme.divider, width: 0.5),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            flex: 3,
            child: Text(
              item.name,
              style: AppTheme.bodyMedium,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          Expanded(
            flex: 1,
            child: _resultBadge(item.result),
          ),
          Expanded(
            flex: 2,
            child: Text(
              item.note ?? '--',
              style: AppTheme.bodySmall,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _resultBadge(String? result) {
    Color color;
    String label;

    switch (result) {
      case 'PASS':
        color = AppTheme.success;
        label = '通过';
        break;
      case 'FAIL':
        color = AppTheme.error;
        label = '不通过';
        break;
      case 'SKIP':
        color = AppTheme.warning;
        label = '跳过';
        break;
      default:
        color = AppTheme.textHint;
        label = '--';
    }

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppTheme.spacingSm,
        vertical: AppTheme.spacingXxs,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(AppTheme.radiusSm),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w500,
          color: color,
        ),
        textAlign: TextAlign.center,
      ),
    );
  }

  // ── Helper ────────────────────────────────────────────────────
  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppTheme.spacingSm),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(label, style: AppTheme.bodySmall),
          ),
          Expanded(
            child: Text(value, style: AppTheme.bodyMedium),
          ),
        ],
      ),
    );
  }

  // ── Bottom bar ───────────────────────────────────────────────
  Widget _buildBottomBar() {
    return SafeArea(
      child: Container(
        padding: const EdgeInsets.all(AppTheme.spacingLg),
        decoration: const BoxDecoration(
          color: AppTheme.backgroundWhite,
          border: Border(top: BorderSide(color: AppTheme.border, width: 0.5)),
        ),
        child: SizedBox(
          width: double.infinity,
          height: 48,
          child: OutlinedButton.icon(
            onPressed: _exportReport,
            icon: const Icon(Icons.file_download_outlined, size: 20),
            label: const Text('导出报告'),
          ),
        ),
      ),
    );
  }
}
