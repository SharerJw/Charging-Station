import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import 'package:ops_flutter/core/theme/app_theme.dart';
import 'package:ops_flutter/shared/widgets/common_widgets.dart';

// ──────────────────────────────────────────────────────────────
// Models
// ──────────────────────────────────────────────────────────────

class PendingWorkOrder {
  final String id;
  final String orderNo;
  final String title;
  final String stationName;
  final String priority;
  final String status;
  final DateTime createdAt;

  const PendingWorkOrder({
    required this.id,
    required this.orderNo,
    required this.title,
    required this.stationName,
    required this.priority,
    required this.status,
    required this.createdAt,
  });
}

class DeviceAnomaly {
  final String deviceId;
  final String deviceName;
  final String stationName;
  final String anomalyType;
  final String description;
  final DateTime occurredAt;

  const DeviceAnomaly({
    required this.deviceId,
    required this.deviceName,
    required this.stationName,
    required this.anomalyType,
    required this.description,
    required this.occurredAt,
  });
}

class SparePartCount {
  final String name;
  final int currentStock;
  final int expectedStock;
  final String unit;

  const SparePartCount({
    required this.name,
    required this.currentStock,
    required this.expectedStock,
    this.unit = '个',
  });

  bool get isMatch => currentStock == expectedStock;
}

class ChecklistItem {
  final String id;
  final String label;
  bool isChecked;

  ChecklistItem({
    required this.id,
    required this.label,
    this.isChecked = false,
  });
}

class VehicleInfo {
  final String plateNumber;
  final String model;
  final double fuelLevel; // 0.0 - 1.0
  final int mileage;
  final String status;

  const VehicleInfo({
    required this.plateNumber,
    required this.model,
    required this.fuelLevel,
    required this.mileage,
    required this.status,
  });
}

// ──────────────────────────────────────────────────────────────
// Mock Data
// ──────────────────────────────────────────────────────────────

class ShiftHandoverMockData {
  ShiftHandoverMockData._();

  static const outgoingOperator = '张伟';
  static const incomingOperator = '李明';
  static const shiftTime = '2026-07-20 08:00 - 2026-07-20 20:00';

  static final List<PendingWorkOrder> pendingOrders = [
    PendingWorkOrder(
      id: 'WO001',
      orderNo: 'WO-20260720-001',
      title: '朝阳公园站 A03 充电枪更换',
      stationName: '朝阳公园充电站',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      createdAt: DateTime.now().subtract(const Duration(hours: 2)),
    ),
    PendingWorkOrder(
      id: 'WO002',
      orderNo: 'WO-20260720-002',
      title: '中关村站通信模块重启',
      stationName: '中关村充电站',
      priority: 'MEDIUM',
      status: 'PENDING',
      createdAt: DateTime.now().subtract(const Duration(hours: 4)),
    ),
    PendingWorkOrder(
      id: 'WO003',
      orderNo: 'WO-20260720-003',
      title: '望京站显示屏故障',
      stationName: '望京充电站',
      priority: 'LOW',
      status: 'PENDING',
      createdAt: DateTime.now().subtract(const Duration(hours: 6)),
    ),
  ];

  static final List<DeviceAnomaly> anomalies = [
    DeviceAnomaly(
      deviceId: 'DEV-001',
      deviceName: '充电桩 A03',
      stationName: '朝阳公园充电站',
      anomalyType: '硬件故障',
      description: '充电枪卡扣损坏，已申请备件',
      occurredAt: DateTime(2026, 7, 20, 6, 30),
    ),
    DeviceAnomaly(
      deviceId: 'DEV-002',
      deviceName: '充电桩 B01',
      stationName: '中关村充电站',
      anomalyType: '通信异常',
      description: '4G模块间歇性断连，已重启恢复',
      occurredAt: DateTime(2026, 7, 20, 5, 15),
    ),
    DeviceAnomaly(
      deviceId: 'DEV-003',
      deviceName: '充电桩 C02',
      stationName: '望京充电站',
      anomalyType: '显示异常',
      description: 'LCD屏幕花屏，待更换',
      occurredAt: DateTime(2026, 7, 19, 22, 0),
    ),
  ];

  static final List<SparePartCount> sparePartCounts = [
    const SparePartCount(name: '充电枪头', currentStock: 12, expectedStock: 12),
    const SparePartCount(name: '急停按钮', currentStock: 3, expectedStock: 5),
    const SparePartCount(name: 'LCD显示屏', currentStock: 8, expectedStock: 8),
    const SparePartCount(name: '通信模块', currentStock: 2, expectedStock: 2),
    const SparePartCount(name: '保险丝', currentStock: 43, expectedStock: 45),
  ];

  static final List<ChecklistItem> toolChecklist = [
    ChecklistItem(id: 'T001', label: '万用表'),
    ChecklistItem(id: 'T002', label: '绝缘手套'),
    ChecklistItem(id: 'T003', label: '安全帽'),
    ChecklistItem(id: 'T004', label: '螺丝刀套装'),
    ChecklistItem(id: 'T005', label: '扳手套装'),
    ChecklistItem(id: 'T006', label: '验电器'),
    ChecklistItem(id: 'T007', label: '对讲机'),
    ChecklistItem(id: 'T008', label: '手电筒'),
    ChecklistItem(id: 'T009', label: '急救包'),
    ChecklistItem(id: 'T010', label: '灭火器检查'),
  ];

  static final List<VehicleInfo> vehicles = [
    const VehicleInfo(
      plateNumber: '京A·12345',
      model: '工程车-福田图雅诺',
      fuelLevel: 0.75,
      mileage: 23456,
      status: '可用',
    ),
    const VehicleInfo(
      plateNumber: '京B·67890',
      model: '巡检车-比亚迪秦',
      fuelLevel: 0.35,
      mileage: 45678,
      status: '可用',
    ),
  ];
}

// ──────────────────────────────────────────────────────────────
// Shift Handover Page
// ──────────────────────────────────────────────────────────────

class ShiftHandoverPage extends StatefulWidget {
  const ShiftHandoverPage({super.key});

  @override
  State<ShiftHandoverPage> createState() => _ShiftHandoverPageState();
}

class _ShiftHandoverPageState extends State<ShiftHandoverPage> {
  late List<ChecklistItem> _checklist;

  @override
  void initState() {
    super.initState();
    _checklist = ShiftHandoverMockData.toolChecklist
        .map((item) => ChecklistItem(id: item.id, label: item.label))
        .toList();
  }

  bool get _allChecked => _checklist.every((item) => item.isChecked);
  int get _checkedCount => _checklist.where((item) => item.isChecked).length;

  // ── Confirm handover ──────────────────────────────────────────
  void _confirmHandover() {
    if (!_allChecked) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('请先完成工具检查清单')),
      );
      return;
    }

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('确认交接'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('交班人：${ShiftHandoverMockData.outgoingOperator}'),
            const SizedBox(height: AppTheme.spacingXs),
            Text('接班人：${ShiftHandoverMockData.incomingOperator}'),
            const SizedBox(height: AppTheme.spacingSm),
            const Text(
              '确认完成交接班？交接后当前班次的工作记录将归档。',
              style: AppTheme.bodySmall,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('取消'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('交接班已确认完成'),
                  backgroundColor: AppTheme.success,
                ),
              );
            },
            child: const Text('确认交接'),
          ),
        ],
      ),
    );
  }

  // ── Build ──────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        title: const Text('交接班'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 20),
          onPressed: () => context.pop(),
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildOperatorInfo(),
            _buildSectionTitle('未完成工单', Icons.assignment_rounded, AppTheme.warning),
            _buildPendingOrders(),
            _buildSectionTitle('设备异常汇总', Icons.warning_amber_rounded, AppTheme.error),
            _buildAnomalies(),
            _buildSectionTitle('备件盘点', Icons.inventory_2_outlined, AppTheme.brandBlue),
            _buildSparePartCounts(),
            _buildSectionTitle('工具检查清单', Icons.build_rounded, AppTheme.success),
            _buildToolChecklist(),
            _buildSectionTitle('车辆状态', Icons.directions_car_rounded, AppTheme.info),
            _buildVehicles(),
            const SizedBox(height: AppTheme.spacingXl),
            _buildConfirmButton(),
            const SizedBox(height: AppTheme.spacingXxl),
          ],
        ),
      ),
    );
  }

  // ── Operator Info ─────────────────────────────────────────────
  Widget _buildOperatorInfo() {
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
      padding: const EdgeInsets.all(AppTheme.spacingXl),
      child: Column(
        children: [
          // ── Shift time ─────────────────────────────────────
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: AppTheme.spacingMd,
              vertical: AppTheme.spacingXs,
            ),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(AppTheme.radiusSm),
            ),
            child: Text(
              ShiftHandoverMockData.shiftTime,
              style: const TextStyle(
                fontSize: 13,
                color: Colors.white,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          const SizedBox(height: AppTheme.spacingXl),
          // ── Operator pair ──────────────────────────────────
          Row(
            children: [
              // Outgoing
              Expanded(
                child: Column(
                  children: [
                    Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(28),
                      ),
                      child: const Icon(Icons.person_rounded, color: Colors.white, size: 30),
                    ),
                    const SizedBox(height: AppTheme.spacingSm),
                    const Text(
                      '交班人',
                      style: TextStyle(fontSize: 12, color: Colors.white70),
                    ),
                    const SizedBox(height: AppTheme.spacingXxs),
                    Text(
                      ShiftHandoverMockData.outgoingOperator,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
              // Arrow
              const Icon(
                Icons.arrow_forward_rounded,
                color: Colors.white,
                size: 28,
              ),
              // Incoming
              Expanded(
                child: Column(
                  children: [
                    Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(28),
                      ),
                      child: const Icon(Icons.person_add_rounded, color: Colors.white, size: 30),
                    ),
                    const SizedBox(height: AppTheme.spacingSm),
                    const Text(
                      '接班人',
                      style: TextStyle(fontSize: 12, color: Colors.white70),
                    ),
                    const SizedBox(height: AppTheme.spacingXxs),
                    Text(
                      ShiftHandoverMockData.incomingOperator,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ── Section Title ─────────────────────────────────────────────
  Widget _buildSectionTitle(String title, IconData icon, Color color) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppTheme.spacingLg,
        AppTheme.spacingXl,
        AppTheme.spacingLg,
        AppTheme.spacingSm,
      ),
      child: Row(
        children: [
          Container(
            width: 4,
            height: 18,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(width: AppTheme.spacingSm),
          Icon(icon, size: 18, color: color),
          const SizedBox(width: AppTheme.spacingXs),
          Text(title, style: AppTheme.titleMedium),
        ],
      ),
    );
  }

  // ── Pending Orders ────────────────────────────────────────────
  Widget _buildPendingOrders() {
    final orders = ShiftHandoverMockData.pendingOrders;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: AppTheme.spacingLg),
      decoration: BoxDecoration(
        color: AppTheme.backgroundWhite,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        border: Border.all(color: AppTheme.border, width: 0.5),
      ),
      child: Column(
        children: [
          // ── Summary header ──────────────────────────────────
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: AppTheme.spacingLg,
              vertical: AppTheme.spacingSm,
            ),
            decoration: BoxDecoration(
              color: AppTheme.warning.withValues(alpha: 0.04),
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(AppTheme.radiusLg),
              ),
            ),
            child: Row(
              children: [
                const Icon(Icons.info_outline_rounded, size: 16, color: AppTheme.warning),
                const SizedBox(width: AppTheme.spacingXs),
                Text(
                  '共 ${orders.length} 项未完成工单需要跟进',
                  style: AppTheme.bodySmall.copyWith(color: AppTheme.warning),
                ),
              ],
            ),
          ),
          // ── Order items ────────────────────────────────────
          ...orders.map((order) => _buildOrderItem(order)),
        ],
      ),
    );
  }

  Widget _buildOrderItem(PendingWorkOrder order) {
    final priorityColor = _priorityColor(order.priority);

    return Container(
      padding: const EdgeInsets.all(AppTheme.spacingLg),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: AppTheme.divider, width: 0.5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Row 1: Order number + priority ──────────────────
          Row(
            children: [
              Expanded(
                child: Text(
                  order.orderNo,
                  style: AppTheme.bodySmall.copyWith(color: AppTheme.textSecondary),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppTheme.spacingSm,
                  vertical: AppTheme.spacingXxs,
                ),
                decoration: BoxDecoration(
                  color: priorityColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                ),
                child: Text(
                  order.priority == 'HIGH' ? '高优先级' : order.priority == 'MEDIUM' ? '中优先级' : '低优先级',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: priorityColor,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppTheme.spacingXs),
          // ── Row 2: Title ────────────────────────────────────
          Text(order.title, style: AppTheme.bodyMedium),
          const SizedBox(height: AppTheme.spacingXs),
          // ── Row 3: Station + status + time ──────────────────
          Row(
            children: [
              const Icon(Icons.location_on_outlined, size: 14, color: AppTheme.textSecondary),
              const SizedBox(width: AppTheme.spacingXs),
              Expanded(
                child: Text(order.stationName, style: AppTheme.bodySmall),
              ),
              StatusTag.fromStatus(status: order.status),
              const SizedBox(width: AppTheme.spacingSm),
              Text(
                _formatTime(order.createdAt),
                style: AppTheme.caption,
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ── Device Anomalies ──────────────────────────────────────────
  Widget _buildAnomalies() {
    final anomalies = ShiftHandoverMockData.anomalies;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: AppTheme.spacingLg),
      decoration: BoxDecoration(
        color: AppTheme.backgroundWhite,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        border: Border.all(color: AppTheme.border, width: 0.5),
      ),
      child: Column(
        children: [
          // ── Summary header ──────────────────────────────────
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: AppTheme.spacingLg,
              vertical: AppTheme.spacingSm,
            ),
            decoration: BoxDecoration(
              color: AppTheme.error.withValues(alpha: 0.04),
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(AppTheme.radiusLg),
              ),
            ),
            child: Row(
              children: [
                const Icon(Icons.warning_amber_rounded, size: 16, color: AppTheme.error),
                const SizedBox(width: AppTheme.spacingXs),
                Text(
                  '共 ${anomalies.length} 项设备异常需关注',
                  style: AppTheme.bodySmall.copyWith(color: AppTheme.error),
                ),
              ],
            ),
          ),
          // ── Anomaly items ──────────────────────────────────
          ...anomalies.map((anomaly) => _buildAnomalyItem(anomaly)),
        ],
      ),
    );
  }

  Widget _buildAnomalyItem(DeviceAnomaly anomaly) {
    return Container(
      padding: const EdgeInsets.all(AppTheme.spacingLg),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: AppTheme.divider, width: 0.5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Row 1: Device + type ───────────────────────────
          Row(
            children: [
              const Icon(Icons.memory_rounded, size: 14, color: AppTheme.textSecondary),
              const SizedBox(width: AppTheme.spacingXs),
              Expanded(
                child: Text(anomaly.deviceName, style: AppTheme.bodyMedium),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppTheme.spacingSm,
                  vertical: AppTheme.spacingXxs,
                ),
                decoration: BoxDecoration(
                  color: AppTheme.error.withValues(alpha: 0.06),
                  borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                ),
                child: Text(
                  anomaly.anomalyType,
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.error,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppTheme.spacingXs),
          // ── Row 2: Station ──────────────────────────────────
          Row(
            children: [
              const Icon(Icons.location_on_outlined, size: 14, color: AppTheme.textSecondary),
              const SizedBox(width: AppTheme.spacingXs),
              Text(anomaly.stationName, style: AppTheme.bodySmall),
            ],
          ),
          const SizedBox(height: AppTheme.spacingXs),
          // ── Row 3: Description ──────────────────────────────
          Text(
            anomaly.description,
            style: AppTheme.bodySmall.copyWith(color: AppTheme.textSecondary),
          ),
          const SizedBox(height: AppTheme.spacingXs),
          // ── Row 4: Time ────────────────────────────────────
          Text(
            '发生时间：${DateFormat('MM-dd HH:mm').format(anomaly.occurredAt)}',
            style: AppTheme.caption,
          ),
        ],
      ),
    );
  }

  // ── Spare Part Counts ─────────────────────────────────────────
  Widget _buildSparePartCounts() {
    final parts = ShiftHandoverMockData.sparePartCounts;
    final mismatchCount = parts.where((p) => !p.isMatch).length;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: AppTheme.spacingLg),
      decoration: BoxDecoration(
        color: AppTheme.backgroundWhite,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        border: Border.all(color: AppTheme.border, width: 0.5),
      ),
      child: Column(
        children: [
          // ── Summary header ──────────────────────────────────
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: AppTheme.spacingLg,
              vertical: AppTheme.spacingSm,
            ),
            decoration: BoxDecoration(
              color: (mismatchCount > 0 ? AppTheme.warning : AppTheme.success).withValues(alpha: 0.04),
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(AppTheme.radiusLg),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  mismatchCount > 0 ? Icons.info_outline_rounded : Icons.check_circle_outline_rounded,
                  size: 16,
                  color: mismatchCount > 0 ? AppTheme.warning : AppTheme.success,
                ),
                const SizedBox(width: AppTheme.spacingXs),
                Text(
                  mismatchCount > 0
                      ? '$mismatchCount 项备件数量与记录不符'
                      : '所有备件数量核对一致',
                  style: AppTheme.bodySmall.copyWith(
                    color: mismatchCount > 0 ? AppTheme.warning : AppTheme.success,
                  ),
                ),
              ],
            ),
          ),
          // ── Parts table ────────────────────────────────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppTheme.spacingLg),
            child: Table(
              columnWidths: const {
                0: FlexColumnWidth(3),
                1: FlexColumnWidth(2),
                2: FlexColumnWidth(2),
                3: FlexColumnWidth(1.5),
              },
              children: [
                // Header
                TableRow(
                  decoration: const BoxDecoration(
                    border: Border(bottom: BorderSide(color: AppTheme.divider)),
                  ),
                  children: [
                    _tableHeader('备件名称'),
                    _tableHeader('实际库存'),
                    _tableHeader('账面库存'),
                    _tableHeader('状态'),
                  ],
                ),
                // Rows
                ...parts.map((part) => TableRow(
                  decoration: const BoxDecoration(
                    border: Border(bottom: BorderSide(color: AppTheme.divider, width: 0.5)),
                  ),
                  children: [
                    _tableCell(part.name),
                    _tableCell('${part.currentStock} ${part.unit}'),
                    _tableCell('${part.expectedStock} ${part.unit}'),
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: AppTheme.spacingSm),
                      child: Icon(
                        part.isMatch
                            ? Icons.check_circle_rounded
                            : Icons.error_rounded,
                        size: 16,
                        color: part.isMatch ? AppTheme.success : AppTheme.error,
                      ),
                    ),
                  ],
                )),
              ],
            ),
          ),
          const SizedBox(height: AppTheme.spacingMd),
        ],
      ),
    );
  }

  Widget _tableHeader(String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppTheme.spacingSm),
      child: Text(
        text,
        style: AppTheme.bodySmall.copyWith(fontWeight: FontWeight.w600),
      ),
    );
  }

  Widget _tableCell(String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppTheme.spacingSm),
      child: Text(text, style: AppTheme.bodySmall),
    );
  }

  // ── Tool Checklist ────────────────────────────────────────────
  Widget _buildToolChecklist() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: AppTheme.spacingLg),
      decoration: BoxDecoration(
        color: AppTheme.backgroundWhite,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        border: Border.all(color: AppTheme.border, width: 0.5),
      ),
      child: Column(
        children: [
          // ── Progress header ──────────────────────────────────
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: AppTheme.spacingLg,
              vertical: AppTheme.spacingSm,
            ),
            decoration: BoxDecoration(
              color: (_allChecked ? AppTheme.success : AppTheme.info).withValues(alpha: 0.04),
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(AppTheme.radiusLg),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  _allChecked ? Icons.check_circle_rounded : Icons.info_outline_rounded,
                  size: 16,
                  color: _allChecked ? AppTheme.success : AppTheme.info,
                ),
                const SizedBox(width: AppTheme.spacingXs),
                Text(
                  '已检查 $_checkedCount / ${_checklist.length}',
                  style: AppTheme.bodySmall.copyWith(
                    color: _allChecked ? AppTheme.success : AppTheme.info,
                  ),
                ),
                const Spacer(),
                if (!_allChecked)
                  Text(
                    '请逐项确认工具齐全',
                    style: AppTheme.caption,
                  ),
              ],
            ),
          ),
          // ── Checklist items ──────────────────────────────────
          ..._checklist.asMap().entries.map((entry) {
            final index = entry.key;
            final item = entry.value;
            final isLast = index == _checklist.length - 1;

            return InkWell(
              onTap: () {
                setState(() {
                  item.isChecked = !item.isChecked;
                });
              },
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppTheme.spacingLg,
                  vertical: AppTheme.spacingMd,
                ),
                decoration: BoxDecoration(
                  border: isLast
                      ? null
                      : const Border(
                          bottom: BorderSide(color: AppTheme.divider, width: 0.5),
                        ),
                ),
                child: Row(
                  children: [
                    Icon(
                      item.isChecked
                          ? Icons.check_circle_rounded
                          : Icons.radio_button_unchecked_rounded,
                      size: 22,
                      color: item.isChecked ? AppTheme.success : AppTheme.textHint,
                    ),
                    const SizedBox(width: AppTheme.spacingMd),
                    Text(
                      item.label,
                      style: AppTheme.bodyMedium.copyWith(
                        color: item.isChecked ? AppTheme.textSecondary : AppTheme.textPrimary,
                        decoration: item.isChecked ? TextDecoration.lineThrough : null,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
        ],
      ),
    );
  }

  // ── Vehicles ──────────────────────────────────────────────────
  Widget _buildVehicles() {
    final vehicles = ShiftHandoverMockData.vehicles;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: AppTheme.spacingLg),
      decoration: BoxDecoration(
        color: AppTheme.backgroundWhite,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        border: Border.all(color: AppTheme.border, width: 0.5),
      ),
      child: Column(
        children: [
          ...vehicles.asMap().entries.map((entry) {
            final index = entry.key;
            final vehicle = entry.value;
            final isLast = index == vehicles.length - 1;

            return Container(
              padding: const EdgeInsets.all(AppTheme.spacingLg),
              decoration: BoxDecoration(
                border: isLast
                    ? null
                    : const Border(
                        bottom: BorderSide(color: AppTheme.divider, width: 0.5),
                      ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ── Row 1: Plate + status ───────────────────
                  Row(
                    children: [
                      const Icon(Icons.directions_car_rounded, size: 18, color: AppTheme.brandBlue),
                      const SizedBox(width: AppTheme.spacingSm),
                      Text(
                        vehicle.plateNumber,
                        style: AppTheme.titleMedium,
                      ),
                      const Spacer(),
                      StatusTag(
                        text: vehicle.status,
                        color: vehicle.status == '可用' ? AppTheme.success : AppTheme.warning,
                      ),
                    ],
                  ),
                  const SizedBox(height: AppTheme.spacingXs),
                  // ── Row 2: Model ────────────────────────────
                  Text(vehicle.model, style: AppTheme.bodySmall),
                  const SizedBox(height: AppTheme.spacingSm),
                  // ── Row 3: Fuel + Mileage ───────────────────
                  Row(
                    children: [
                      // Fuel level
                      Icon(
                        Icons.local_gas_station_rounded,
                        size: 14,
                        color: vehicle.fuelLevel < 0.3 ? AppTheme.error : AppTheme.textSecondary,
                      ),
                      const SizedBox(width: AppTheme.spacingXs),
                      SizedBox(
                        width: 60,
                        height: 6,
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(3),
                          child: LinearProgressIndicator(
                            value: vehicle.fuelLevel,
                            backgroundColor: AppTheme.divider,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              vehicle.fuelLevel < 0.3
                                  ? AppTheme.error
                                  : vehicle.fuelLevel < 0.6
                                      ? AppTheme.warning
                                      : AppTheme.success,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: AppTheme.spacingXs),
                      Text(
                        '${(vehicle.fuelLevel * 100).toInt()}%',
                        style: AppTheme.numberSmall.copyWith(
                          fontSize: 12,
                          color: vehicle.fuelLevel < 0.3 ? AppTheme.error : AppTheme.textSecondary,
                        ),
                      ),
                      const SizedBox(width: AppTheme.spacingXl),
                      // Mileage
                      const Icon(Icons.speed_rounded, size: 14, color: AppTheme.textSecondary),
                      const SizedBox(width: AppTheme.spacingXs),
                      Text(
                        '${vehicle.mileage} km',
                        style: AppTheme.bodySmall,
                      ),
                    ],
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  // ── Confirm Button ────────────────────────────────────────────
  Widget _buildConfirmButton() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppTheme.spacingXl),
      child: SizedBox(
        width: double.infinity,
        height: 52,
        child: ElevatedButton(
          onPressed: _allChecked ? _confirmHandover : null,
          style: ElevatedButton.styleFrom(
            backgroundColor: _allChecked ? AppTheme.brandBlue : AppTheme.textHint,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppTheme.radiusMd),
            ),
            textStyle: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          child: Text(
            _allChecked ? '确认交接' : '请先完成工具检查 ($_checkedCount/${_checklist.length})',
          ),
        ),
      ),
    );
  }

  // ── Helpers ───────────────────────────────────────────────────
  Color _priorityColor(String priority) {
    switch (priority.toUpperCase()) {
      case 'HIGH':
        return AppTheme.error;
      case 'MEDIUM':
        return AppTheme.warning;
      case 'LOW':
        return AppTheme.success;
      default:
        return AppTheme.info;
    }
  }

  String _formatTime(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inMinutes < 1) return '刚刚';
    if (diff.inMinutes < 60) return '${diff.inMinutes}分钟前';
    if (diff.inHours < 24) return '${diff.inHours}小时前';
    if (diff.inDays < 7) return '${diff.inDays}天前';
    return DateFormat('M/d').format(dt);
  }
}
