import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import 'package:ops_flutter/core/network/api_client.dart';
import 'package:ops_flutter/core/network/api_endpoints.dart';
import 'package:ops_flutter/core/theme/app_theme.dart';
import 'package:ops_flutter/features/alert/models/alert_models.dart';
import 'package:ops_flutter/shared/widgets/common_widgets.dart';

/// Alert detail page showing device snapshot, 24h timeline, and process records.
class AlertDetailPage extends StatefulWidget {
  final String alertId;

  const AlertDetailPage({super.key, required this.alertId});

  @override
  State<AlertDetailPage> createState() => _AlertDetailPageState();
}

class _AlertDetailPageState extends State<AlertDetailPage> {
  AlertDetail? _detail;
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadDetail();
  }

  Future<void> _loadDetail() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await ApiClient.instance.get(
        ApiEndpoints.alertDetail.replaceAll('{id}', widget.alertId),
      );
      final data = response.data;
      if (data != null && data is Map<String, dynamic>) {
        setState(() {
          _detail = AlertDetail.fromJson(data);
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

  Future<void> _handleAlert() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('确认处理'),
        content: const Text('确认处理此告警？'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('取消'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('确认'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await ApiClient.instance.post(
          ApiEndpoints.alertHandle(widget.alertId),
          data: {'handler': 'ops', 'result': '已处理'},
        );
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('告警已处理')),
          );
          _loadDetail();
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('操作失败，请重试')),
          );
        }
      }
    }
  }

  Future<void> _dispatchOrder() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('派单确认'),
        content: const Text('确认为此告警创建工单并派单？'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('取消'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('确认派单'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      // TODO: 后端暂未实现工单创建接口，上线后替换为实际调用
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('工单创建功能暂未开放，敬请期待')),
        );
      }
    }
  }

  Color _levelColor(String level) {
    switch (level) {
      case 'P0':
        return AppTheme.error;
      case 'P1':
        return const Color(0xFFFF7A00);
      case 'P2':
        return AppTheme.warning;
      case 'P3':
        return AppTheme.info;
      default:
        return AppTheme.textSecondary;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        title: const Text('告警详情'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 20),
          onPressed: () => context.pop(),
        ),
      ),
      body: _buildBody(),
      bottomNavigationBar: _detail?.alert.isPending == true
          ? _buildBottomActions()
          : null,
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const LoadingIndicator(message: '加载告警详情...');
    }

    if (_errorMessage != null) {
      return ErrorRetryWidget(
        message: _errorMessage!,
        onRetry: _loadDetail,
      );
    }

    if (_detail == null) {
      return const EmptyState(
        icon: Icons.warning_amber_rounded,
        title: '告警不存在',
      );
    }

    final alert = _detail!.alert;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppTheme.spacingLg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Header: Level + Title ───────────────────────────
          _buildHeader(alert),
          const SizedBox(height: AppTheme.spacingLg),

          // ── Device Snapshot ─────────────────────────────────
          if (_detail!.deviceSnapshot.isNotEmpty) ...[
            _buildSectionTitle('设备快照'),
            const SizedBox(height: AppTheme.spacingSm),
            _buildDeviceSnapshot(),
            const SizedBox(height: AppTheme.spacingLg),
          ],

          // ── 24h Timeline ───────────────────────────────────
          if (_detail!.timeline.isNotEmpty) ...[
            _buildSectionTitle('24小时时间线'),
            const SizedBox(height: AppTheme.spacingSm),
            _buildTimeline(),
            const SizedBox(height: AppTheme.spacingLg),
          ],

          // ── Process Records ────────────────────────────────
          if (_detail!.processRecords.isNotEmpty) ...[
            _buildSectionTitle('处理记录'),
            const SizedBox(height: AppTheme.spacingSm),
            _buildProcessRecords(),
          ],
        ],
      ),
    );
  }

  // ── Header ───────────────────────────────────────────────────
  Widget _buildHeader(AlertRecord alert) {
    final color = _levelColor(alert.level);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppTheme.spacingLg),
      decoration: BoxDecoration(
        color: AppTheme.backgroundWhite,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        border: Border.all(color: AppTheme.border, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Level badge + status
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppTheme.spacingSm,
                  vertical: AppTheme.spacingXxs,
                ),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                ),
                child: Text(
                  alert.level,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: color,
                  ),
                ),
              ),
              const SizedBox(width: AppTheme.spacingSm),
              StatusTag(
                text: alert.status == 'pending'
                    ? '待处理'
                    : alert.status == 'processing'
                        ? '处理中'
                        : alert.status == 'resolved'
                            ? '已处理'
                            : '已忽略',
              ),
            ],
          ),
          const SizedBox(height: AppTheme.spacingMd),

          // Title
          Text(
            alert.title,
            style: AppTheme.titleLarge,
          ),

          if (alert.description != null &&
              alert.description!.isNotEmpty) ...[
            const SizedBox(height: AppTheme.spacingSm),
            Text(
              alert.description!,
              style: AppTheme.bodyMedium.copyWith(
                color: AppTheme.textSecondary,
              ),
            ),
          ],

          const SizedBox(height: AppTheme.spacingMd),

          // Info row: station + device + time
          _buildInfoRow(
            icon: Icons.location_on_outlined,
            text: alert.stationName,
          ),
          const SizedBox(height: AppTheme.spacingXs),
          _buildInfoRow(
            icon: Icons.memory_rounded,
            text: alert.deviceCode,
          ),
          const SizedBox(height: AppTheme.spacingXs),
          _buildInfoRow(
            icon: Icons.access_time_rounded,
            text: DateFormat('yyyy-MM-dd HH:mm:ss').format(alert.createdAt),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow({required IconData icon, required String text}) {
    return Row(
      children: [
        Icon(icon, size: 14, color: AppTheme.textSecondary),
        const SizedBox(width: AppTheme.spacingXs),
        Expanded(
          child: Text(
            text,
            style: AppTheme.bodySmall,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
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

  // ── Device snapshot table ────────────────────────────────────
  Widget _buildDeviceSnapshot() {
    final entries = _detail!.deviceSnapshot.entries.toList();

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: AppTheme.backgroundWhite,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        border: Border.all(color: AppTheme.border, width: 0.5),
      ),
      child: Column(
        children: List.generate(entries.length, (index) {
          final entry = entries[index];
          final isEven = index % 2 == 0;

          return Container(
            color: isEven ? AppTheme.backgroundWhite : AppTheme.backgroundLight,
            padding: const EdgeInsets.symmetric(
              horizontal: AppTheme.spacingLg,
              vertical: AppTheme.spacingMd,
            ),
            child: Row(
              children: [
                SizedBox(
                  width: 100,
                  child: Text(
                    entry.key,
                    style: AppTheme.bodySmall.copyWith(
                      fontWeight: FontWeight.w500,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ),
                Expanded(
                  child: Text(
                    entry.value,
                    style: AppTheme.bodyMedium,
                  ),
                ),
              ],
            ),
          );
        }),
      ),
    );
  }

  // ── Timeline ─────────────────────────────────────────────────
  Widget _buildTimeline() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppTheme.spacingLg),
      decoration: BoxDecoration(
        color: AppTheme.backgroundWhite,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        border: Border.all(color: AppTheme.border, width: 0.5),
      ),
      child: Column(
        children: _detail!.timeline.asMap().entries.map((entry) {
          final index = entry.key;
          final event = entry.value;
          final isLast = index == _detail!.timeline.length - 1;

          return _TimelineItem(
            event: event,
            isLast: isLast,
          );
        }).toList(),
      ),
    );
  }

  // ── Process records ──────────────────────────────────────────
  Widget _buildProcessRecords() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppTheme.spacingLg),
      decoration: BoxDecoration(
        color: AppTheme.backgroundWhite,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        border: Border.all(color: AppTheme.border, width: 0.5),
      ),
      child: Column(
        children: _detail!.processRecords.map((record) {
          return Padding(
            padding: const EdgeInsets.only(bottom: AppTheme.spacingMd),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.person_outline_rounded,
                      size: 14,
                      color: AppTheme.textSecondary,
                    ),
                    const SizedBox(width: AppTheme.spacingXs),
                    Text(
                      record.operatorName,
                      style: AppTheme.bodySmall.copyWith(
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(width: AppTheme.spacingSm),
                    StatusTag(
                      text: record.action,
                      color: record.action == 'resolved'
                          ? AppTheme.success
                          : record.action == 'dispatched'
                              ? AppTheme.warning
                              : AppTheme.info,
                    ),
                    const Spacer(),
                    Text(
                      DateFormat('MM-dd HH:mm').format(record.createdAt),
                      style: AppTheme.caption,
                    ),
                  ],
                ),
                if (record.remark != null && record.remark!.isNotEmpty) ...[
                  const SizedBox(height: AppTheme.spacingXs),
                  Text(
                    record.remark!,
                    style: AppTheme.bodySmall.copyWith(
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ],
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  // ── Bottom action bar ────────────────────────────────────────
  Widget _buildBottomActions() {
    return Container(
      padding: EdgeInsets.fromLTRB(
        AppTheme.spacingLg,
        AppTheme.spacingMd,
        AppTheme.spacingLg,
        MediaQuery.of(context).padding.bottom + AppTheme.spacingMd,
      ),
      decoration: const BoxDecoration(
        color: AppTheme.backgroundWhite,
        border: Border(
          top: BorderSide(color: AppTheme.border, width: 0.5),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: OutlinedButton.icon(
              onPressed: _dispatchOrder,
              icon: const Icon(Icons.assignment_ind_rounded, size: 18),
              label: const Text('派单'),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppTheme.brandBlue,
                side: const BorderSide(color: AppTheme.brandBlue),
                padding: const EdgeInsets.symmetric(
                  vertical: AppTheme.spacingMd,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                ),
              ),
            ),
          ),
          const SizedBox(width: AppTheme.spacingMd),
          Expanded(
            child: ElevatedButton.icon(
              onPressed: _handleAlert,
              icon: const Icon(Icons.check_circle_outline_rounded, size: 18),
              label: const Text('处理'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.brandBlue,
                foregroundColor: AppTheme.textWhite,
                padding: const EdgeInsets.symmetric(
                  vertical: AppTheme.spacingMd,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────
// Timeline Item widget
// ──────────────────────────────────────────────────────────────

class _TimelineItem extends StatelessWidget {
  final AlertTimelineEvent event;
  final bool isLast;

  const _TimelineItem({required this.event, required this.isLast});

  Color get _dotColor {
    switch (event.type) {
      case 'alert':
        return AppTheme.error;
      case 'process':
        return AppTheme.brandBlue;
      case 'status_change':
      default:
        return AppTheme.warning;
    }
  }

  @override
  Widget build(BuildContext context) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Dot + line ────────────────────────────────────
          SizedBox(
            width: 20,
            child: Column(
              children: [
                Container(
                  width: 10,
                  height: 10,
                  decoration: BoxDecoration(
                    color: _dotColor,
                    shape: BoxShape.circle,
                  ),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 1,
                      color: AppTheme.border,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: AppTheme.spacingSm),

          // ── Content ──────────────────────────────────────
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: AppTheme.spacingMd),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    event.title,
                    style: AppTheme.bodyMedium.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  if (event.detail != null && event.detail!.isNotEmpty) ...[
                    const SizedBox(height: AppTheme.spacingXxs),
                    Text(
                      event.detail!,
                      style: AppTheme.bodySmall.copyWith(
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ],
                  const SizedBox(height: AppTheme.spacingXxs),
                  Text(
                    DateFormat('HH:mm:ss').format(event.time),
                    style: AppTheme.caption,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
