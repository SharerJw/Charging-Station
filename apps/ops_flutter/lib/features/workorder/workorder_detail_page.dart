import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import 'package:ops_flutter/core/network/api_client.dart';
import 'package:ops_flutter/core/network/api_endpoints.dart';
import 'package:ops_flutter/core/theme/app_theme.dart';
import 'package:ops_flutter/features/workorder/workorder_model.dart';
import 'package:ops_flutter/shared/widgets/common_widgets.dart';

/// Work order detail page showing SLA, station/device info, timeline, and actions.
class WorkOrderDetailPage extends StatefulWidget {
  final String workOrderId;

  const WorkOrderDetailPage({super.key, required this.workOrderId});

  @override
  State<WorkOrderDetailPage> createState() => _WorkOrderDetailPageState();
}

class _WorkOrderDetailPageState extends State<WorkOrderDetailPage> {
  WorkOrder? _order;
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
        ApiEndpoints.workOrderDetail.replaceAll('{id}', widget.workOrderId),
      );
      final data = response.data;
      if (data != null && data is Map<String, dynamic>) {
        setState(() {
          _order = WorkOrder.fromJson(data);
        });
      }
    } on DioException catch (e) {
      setState(() {
        _errorMessage = e.message ?? '加载失败';
      });
    } catch (e) {
      setState(() {
        _errorMessage = '加载工单详情失败';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _startProcessing() async {
    if (_order == null) return;
    try {
      await ApiClient.instance.post(
        ApiEndpoints.workOrderAccept(_order!.id),
      );
      await _loadDetail();
    } on DioException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message ?? '操作失败')),
        );
      }
    }
  }

  Future<void> _completeOrder() async {
    if (_order == null) return;
    // Navigate to the process page to fill in the form before completing
    context.push('/work-order/${_order!.id}/process');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        title: Text(_order?.orderNo ?? '工单详情'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 20),
          onPressed: () => context.pop(),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, size: 22),
            onPressed: _loadDetail,
          ),
        ],
      ),
      body: _buildBody(),
      bottomNavigationBar: _buildBottomActions(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const LoadingIndicator(message: '加载中...');
    }

    if (_errorMessage != null) {
      return ErrorRetryWidget(
        message: _errorMessage!,
        onRetry: _loadDetail,
      );
    }

    final order = _order;
    if (order == null) {
      return const EmptyState(
        icon: Icons.error_outline_rounded,
        title: '工单不存在',
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppTheme.spacingLg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── SLA Progress ────────────────────────────────────
          _buildSlaCard(order),
          const SizedBox(height: AppTheme.spacingLg),
          // ── Basic Info ──────────────────────────────────────
          _buildInfoCard(order),
          const SizedBox(height: AppTheme.spacingLg),
          // ── Station / Device ────────────────────────────────
          _buildStationDeviceCard(order),
          const SizedBox(height: AppTheme.spacingLg),
          // ── Fault Description ───────────────────────────────
          if (order.description != null && order.description!.isNotEmpty)
            _buildDescriptionCard(order),
          if (order.description != null && order.description!.isNotEmpty)
            const SizedBox(height: AppTheme.spacingLg),
          // ── Timeline ────────────────────────────────────────
          _buildTimelineCard(order),
        ],
      ),
    );
  }

  // ── SLA Progress Card ────────────────────────────────────────
  Widget _buildSlaCard(WorkOrder order) {
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
              const Icon(Icons.timer_outlined, size: 18, color: AppTheme.brandBlue),
              const SizedBox(width: AppTheme.spacingSm),
              Text('工单状态', style: AppTheme.titleMedium),
              const Spacer(),
              StatusTag.fromStatus(status: order.status),
            ],
          ),
          const SizedBox(height: AppTheme.spacingMd),
          _infoRow('创建时间', DateFormat('yyyy-MM-dd HH:mm').format(order.createdAt)),
          if (order.acceptTime != null)
            _infoRow('接单时间', DateFormat('yyyy-MM-dd HH:mm').format(order.acceptTime!)),
          if (order.completeTime != null)
            _infoRow('完成时间', DateFormat('yyyy-MM-dd HH:mm').format(order.completeTime!)),
        ],
      ),
    );
  }

  // ── Basic Info Card ──────────────────────────────────────────
  Widget _buildInfoCard(WorkOrder order) {
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
          Text('基本信息', style: AppTheme.titleMedium),
          const SizedBox(height: AppTheme.spacingMd),
          _infoRow('工单标题', order.title),
          _infoRow('工单类型', _typeLabel(order.type)),
          _infoRow('优先级', _priorityLabel(order.priority)),
          _infoRow('处理人', order.assignee ?? '待分配'),
          _infoRow('创建时间', DateFormat('yyyy-MM-dd HH:mm').format(order.createdAt)),
          if (order.acceptTime != null)
            _infoRow('接单时间', DateFormat('yyyy-MM-dd HH:mm').format(order.acceptTime!)),
          if (order.completeTime != null)
            _infoRow('完成时间', DateFormat('yyyy-MM-dd HH:mm').format(order.completeTime!)),
        ],
      ),
    );
  }

  // ── Station / Device Card ────────────────────────────────────
  Widget _buildStationDeviceCard(WorkOrder order) {
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
              const Icon(Icons.ev_station_rounded, size: 18, color: AppTheme.brandBlue),
              const SizedBox(width: AppTheme.spacingSm),
              Text('站点 / 设备', style: AppTheme.titleMedium),
            ],
          ),
          const SizedBox(height: AppTheme.spacingMd),
          _infoRow('站点名称', order.stationName),
          if (order.deviceCode.isNotEmpty) _infoRow('设备编码', order.deviceCode),
          const SizedBox(height: AppTheme.spacingSm),
          // Map placeholder
          Container(
            height: 120,
            width: double.infinity,
            decoration: BoxDecoration(
              color: AppTheme.backgroundLight,
              borderRadius: BorderRadius.circular(AppTheme.radiusMd),
            ),
            child: const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.map_rounded, size: 32, color: AppTheme.textHint),
                  SizedBox(height: AppTheme.spacingXs),
                  Text('查看地图', style: AppTheme.bodySmall),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Fault Description Card ───────────────────────────────────
  Widget _buildDescriptionCard(WorkOrder order) {
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
          Text('故障描述', style: AppTheme.titleMedium),
          const SizedBox(height: AppTheme.spacingMd),
          Text(
            order.description!,
            style: AppTheme.bodyMedium.copyWith(height: 1.8),
          ),
        ],
      ),
    );
  }

  // ── Timeline Card ────────────────────────────────────────────
  Widget _buildTimelineCard(WorkOrder order) {
    // 基于后端 WorkOrderVO 的时间字段构建时间线
    final events = <_TimelineEventData>[];
    events.add(_TimelineEventData(
      time: order.createdAt,
      title: '工单创建',
      subtitle: '${order.creator ?? "系统"} 创建了工单',
      icon: Icons.add_circle_outline,
    ));
    if (order.acceptTime != null) {
      events.add(_TimelineEventData(
        time: order.acceptTime!,
        title: '接单处理',
        subtitle: '${order.assignee ?? "运维工程师"} 接受了工单',
        icon: Icons.play_circle_outline,
      ));
    }
    if (order.completeTime != null) {
      events.add(_TimelineEventData(
        time: order.completeTime!,
        title: '工单完成',
        subtitle: order.result ?? '已完成',
        icon: Icons.check_circle_outline,
      ));
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
          Text('处理记录', style: AppTheme.titleMedium),
          const SizedBox(height: AppTheme.spacingMd),
          if (events.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: AppTheme.spacingLg),
              child: Center(
                child: Text('暂无处理记录', style: AppTheme.bodySmall),
              ),
            )
          else
            ...events.asMap().entries.map((entry) {
              final index = entry.key;
              final event = entry.value;
              final isLast = index == events.length - 1;
              return _TimelineEventItem(event: event, isLast: isLast);
            }),
        ],
      ),
    );
  }

  // ── Bottom Actions ───────────────────────────────────────────
  Widget? _buildBottomActions() {
    final order = _order;
    if (order == null) return null;

    final status = order.status.toUpperCase();

    if (status == 'PENDING') {
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
            child: ElevatedButton(
              onPressed: _startProcessing,
              child: const Text('开始处理'),
            ),
          ),
        ),
      );
    }

    if (status == 'IN_PROGRESS') {
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
            child: ElevatedButton(
              onPressed: _completeOrder,
              child: const Text('完成工单'),
            ),
          ),
        ),
      );
    }

    return null;
  }

  // ── Helper ───────────────────────────────────────────────────
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

  String _typeLabel(String type) {
    switch (type.toUpperCase()) {
      case 'FAULT_REPAIR':
        return '故障维修';
      case 'ROUTINE_MAINTENANCE':
        return '例行保养';
      case 'INSTALLATION':
        return '安装调试';
      case 'UPGRADE':
        return '升级改造';
      default:
        return type;
    }
  }

  String _priorityLabel(String priority) {
    switch (priority.toUpperCase()) {
      case 'HIGH':
        return '高';
      case 'MEDIUM':
        return '中';
      case 'LOW':
        return '低';
      default:
        return priority;
    }
  }
}

// ──────────────────────────────────────────────────────────────
// Timeline Event Data + Widget
// ──────────────────────────────────────────────────────────────

class _TimelineEventData {
  final DateTime time;
  final String title;
  final String subtitle;
  final IconData icon;

  const _TimelineEventData({
    required this.time,
    required this.title,
    required this.subtitle,
    required this.icon,
  });
}

class _TimelineEventItem extends StatelessWidget {
  final _TimelineEventData event;
  final bool isLast;

  const _TimelineEventItem({required this.event, this.isLast = false});

  @override
  Widget build(BuildContext context) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Timeline dot + line ────────────────────────────
          SizedBox(
            width: 24,
            child: Column(
              children: [
                Icon(event.icon, size: 16, color: AppTheme.brandBlue),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 1.5,
                      color: AppTheme.border,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: AppTheme.spacingSm),
          // ── Content ────────────────────────────────────────
          Expanded(
            child: Container(
              padding: const EdgeInsets.only(bottom: AppTheme.spacingLg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(event.title, style: AppTheme.bodyMedium.copyWith(fontWeight: FontWeight.w600)),
                      const Spacer(),
                      Text(
                        DateFormat('MM-dd HH:mm').format(event.time),
                        style: AppTheme.caption,
                      ),
                    ],
                  ),
                  const SizedBox(height: AppTheme.spacingXs),
                  Text(
                    event.subtitle,
                    style: AppTheme.bodyMedium.copyWith(
                      color: AppTheme.textSecondary,
                    ),
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
