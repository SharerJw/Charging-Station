import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:pull_to_refresh/pull_to_refresh.dart' hide RefreshIndicator;

import 'package:ops_flutter/core/network/api_client.dart';
import 'package:ops_flutter/core/network/api_endpoints.dart';
import 'package:ops_flutter/core/router/app_router.dart';
import 'package:ops_flutter/core/theme/app_theme.dart';
import 'package:ops_flutter/shared/widgets/common_widgets.dart';

// ──────────────────────────────────────────────────────────────
// Models
// ──────────────────────────────────────────────────────────────

/// Auto dispatch rule model.
class DispatchRule {
  final String id;
  final String name;
  final String description;
  final String triggerType; // e.g. FAULT, MAINTENANCE, ALL
  final bool enabled;
  final int priority;
  final String? targetRole;
  final int? maxLoad;
  final DateTime createdAt;

  const DispatchRule({
    required this.id,
    required this.name,
    required this.description,
    required this.triggerType,
    required this.enabled,
    required this.priority,
    this.targetRole,
    this.maxLoad,
    required this.createdAt,
  });

  factory DispatchRule.fromJson(Map<String, dynamic> json) {
    return DispatchRule(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      triggerType: json['triggerType']?.toString() ?? 'ALL',
      enabled: json['enabled'] as bool? ?? true,
      priority: json['priority'] as int? ?? 0,
      targetRole: json['targetRole']?.toString(),
      maxLoad: json['maxLoad'] as int?,
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
    );
  }
}

/// Operator (assignee) model for manual dispatch selection.
class DispatchOperator {
  final String id;
  final String name;
  final String? avatar;
  final String role;
  final double rating;
  final int activeOrders;
  final int completedOrders;
  final bool available;

  const DispatchOperator({
    required this.id,
    required this.name,
    this.avatar,
    required this.role,
    required this.rating,
    required this.activeOrders,
    required this.completedOrders,
    required this.available,
  });

  factory DispatchOperator.fromJson(Map<String, dynamic> json) {
    return DispatchOperator(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      avatar: json['avatar']?.toString(),
      role: json['role']?.toString() ?? '',
      rating: (json['rating'] as num?)?.toDouble() ?? 0.0,
      activeOrders: json['activeOrders'] as int? ?? 0,
      completedOrders: json['completedOrders'] as int? ?? 0,
      available: json['available'] as bool? ?? true,
    );
  }
}

/// Dispatch history record model.
class DispatchRecord {
  final String id;
  final String workOrderId;
  final String workOrderNo;
  final String workOrderTitle;
  final String operatorName;
  final String operatorId;
  final String dispatchType; // AUTO / MANUAL
  final String? remark;
  final DateTime dispatchedAt;
  final String status; // ACCEPTED / PENDING / EXPIRED

  const DispatchRecord({
    required this.id,
    required this.workOrderId,
    required this.workOrderNo,
    required this.workOrderTitle,
    required this.operatorName,
    required this.operatorId,
    required this.dispatchType,
    this.remark,
    required this.dispatchedAt,
    required this.status,
  });

  factory DispatchRecord.fromJson(Map<String, dynamic> json) {
    return DispatchRecord(
      id: json['id']?.toString() ?? '',
      workOrderId: json['workOrderId']?.toString() ?? '',
      workOrderNo: json['workOrderNo']?.toString() ?? '',
      workOrderTitle: json['workOrderTitle']?.toString() ?? '',
      operatorName: json['operatorName']?.toString() ?? '',
      operatorId: json['operatorId']?.toString() ?? '',
      dispatchType: json['dispatchType']?.toString() ?? 'MANUAL',
      remark: json['remark']?.toString(),
      dispatchedAt: DateTime.tryParse(json['dispatchedAt']?.toString() ?? '') ?? DateTime.now(),
      status: json['status']?.toString() ?? 'PENDING',
    );
  }
}

/// Lightweight work order reference for selection.
class WorkOrderRef {
  final String id;
  final String orderNo;
  final String title;
  final String priority;
  final String stationName;
  final DateTime createdAt;

  const WorkOrderRef({
    required this.id,
    required this.orderNo,
    required this.title,
    required this.priority,
    required this.stationName,
    required this.createdAt,
  });

  factory WorkOrderRef.fromJson(Map<String, dynamic> json) {
    return WorkOrderRef(
      id: json['id']?.toString() ?? '',
      orderNo: json['orderNo']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      priority: json['priority']?.toString() ?? 'MEDIUM',
      stationName: json['stationName']?.toString() ?? '',
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
    );
  }
}

// ──────────────────────────────────────────────────────────────
// Dispatch Page
// ──────────────────────────────────────────────────────────────

/// Dispatch management page with three sub-tabs:
/// - Auto dispatch rules
/// - Manual dispatch
/// - Dispatch history
class DispatchPage extends StatefulWidget {
  const DispatchPage({super.key});

  @override
  State<DispatchPage> createState() => _DispatchPageState();
}

class _DispatchPageState extends State<DispatchPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  static const _tabs = ['自动派单', '手动派单', '派单记录'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        title: const Text('派单管理'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 20),
          onPressed: () => context.pop(),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: Container(
            color: AppTheme.backgroundWhite,
            child: TabBar(
              controller: _tabController,
              labelColor: AppTheme.brandBlue,
              unselectedLabelColor: AppTheme.textSecondary,
              labelStyle: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
              unselectedLabelStyle: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w400,
              ),
              indicatorColor: AppTheme.brandBlue,
              indicatorWeight: 2,
              indicatorSize: TabBarIndicatorSize.label,
              tabs: _tabs.map((t) => Tab(text: t)).toList(),
            ),
          ),
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: const [
          _AutoDispatchRulesTab(),
          _ManualDispatchTab(),
          _DispatchHistoryTab(),
        ],
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────
// Tab 1: Auto Dispatch Rules
// ──────────────────────────────────────────────────────────────

class _AutoDispatchRulesTab extends StatefulWidget {
  const _AutoDispatchRulesTab();

  @override
  State<_AutoDispatchRulesTab> createState() => _AutoDispatchRulesTabState();
}

class _AutoDispatchRulesTabState extends State<_AutoDispatchRulesTab> {
  final List<DispatchRule> _rules = [];
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadRules();
  }

  Future<void> _loadRules() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await ApiClient.instance.get(
        ApiEndpoints.dispatchRules,
      );
      final data = response.data;
      if (data is Map<String, dynamic>) {
        final records = (data['list'] as List<dynamic>?)
                ?.map((e) => DispatchRule.fromJson(e as Map<String, dynamic>))
                .toList() ??
            [];
        setState(() {
          _rules.clear();
          _rules.addAll(records);
        });
      }
    } on DioException catch (e) {
      setState(() {
        _errorMessage = e.message ?? '加载失败';
      });
    } catch (_) {
      setState(() {
        _errorMessage = '加载失败，请重试';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _toggleRule(DispatchRule rule) async {
    try {
      await ApiClient.instance.put(
        ApiEndpoints.dispatchRuleDetail(rule.id),
        data: {'enabled': !rule.enabled},
      );
      setState(() {
        final idx = _rules.indexWhere((r) => r.id == rule.id);
        if (idx >= 0) {
          _rules[idx] = DispatchRule(
            id: rule.id,
            name: rule.name,
            description: rule.description,
            triggerType: rule.triggerType,
            enabled: !rule.enabled,
            priority: rule.priority,
            targetRole: rule.targetRole,
            maxLoad: rule.maxLoad,
            createdAt: rule.createdAt,
          );
        }
      });
    } on DioException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message ?? '操作失败')),
        );
      }
    }
  }

  String _triggerTypeLabel(String type) {
    switch (type.toUpperCase()) {
      case 'FAULT':
        return '故障工单';
      case 'MAINTENANCE':
        return '保养工单';
      case 'INSTALLATION':
        return '安装工单';
      case 'ALL':
        return '全部类型';
      default:
        return type;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading && _rules.isEmpty) {
      return const LoadingIndicator(message: '加载规则中...');
    }

    if (_errorMessage != null && _rules.isEmpty) {
      return ErrorRetryWidget(
        message: _errorMessage!,
        onRetry: _loadRules,
      );
    }

    if (_rules.isEmpty) {
      return const EmptyState(
        icon: Icons.rule_rounded,
        title: '暂无自动派单规则',
        subtitle: '系统将根据规则自动分配工单给合适的运维人员',
      );
    }

    return RefreshIndicator(
      onRefresh: _loadRules,
      color: AppTheme.brandBlue,
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(vertical: AppTheme.spacingSm),
        itemCount: _rules.length,
        itemBuilder: (context, index) => _buildRuleCard(_rules[index]),
      ),
    );
  }

  Widget _buildRuleCard(DispatchRule rule) {
    return Container(
      margin: const EdgeInsets.symmetric(
        horizontal: AppTheme.spacingLg,
        vertical: AppTheme.spacingSm,
      ),
      decoration: BoxDecoration(
        color: AppTheme.backgroundWhite,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        border: Border.all(color: AppTheme.border, width: 0.5),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppTheme.spacingLg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Row 1: Name + toggle
            Row(
              children: [
                Expanded(
                  child: Text(
                    rule.name,
                    style: AppTheme.titleMedium,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Switch(
                  value: rule.enabled,
                  onChanged: (_) => _toggleRule(rule),
                  activeColor: AppTheme.brandBlue,
                ),
              ],
            ),
            const SizedBox(height: AppTheme.spacingXs),
            // Description
            Text(
              rule.description,
              style: AppTheme.bodySmall,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: AppTheme.spacingMd),
            // Tags row
            Wrap(
              spacing: AppTheme.spacingSm,
              runSpacing: AppTheme.spacingXs,
              children: [
                _TagChip(
                  label: _triggerTypeLabel(rule.triggerType),
                  color: AppTheme.brandBlue,
                ),
                _TagChip(
                  label: '优先级 ${rule.priority}',
                  color: rule.priority >= 2 ? AppTheme.error : AppTheme.warning,
                ),
                if (rule.targetRole != null)
                  _TagChip(
                    label: rule.targetRole!,
                    color: AppTheme.success,
                  ),
                if (rule.maxLoad != null)
                  _TagChip(
                    label: '最大负载 ${rule.maxLoad}',
                    color: AppTheme.textSecondary,
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────
// Tab 2: Manual Dispatch
// ──────────────────────────────────────────────────────────────

class _ManualDispatchTab extends StatefulWidget {
  const _ManualDispatchTab();

  @override
  State<_ManualDispatchTab> createState() => _ManualDispatchTabState();
}

class _ManualDispatchTabState extends State<_ManualDispatchTab> {
  // ── Work order selection ──────────────────────────
  final List<WorkOrderRef> _pendingOrders = [];
  WorkOrderRef? _selectedOrder;
  bool _isLoadingOrders = false;

  // ── Operator selection ────────────────────────────
  final List<DispatchOperator> _operators = [];
  DispatchOperator? _selectedOperator;
  bool _isLoadingOperators = false;

  // ── Form ──────────────────────────────────────────
  final TextEditingController _remarkController = TextEditingController();
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _loadPendingOrders();
    _loadOperators();
  }

  @override
  void dispose() {
    _remarkController.dispose();
    super.dispose();
  }

  Future<void> _loadPendingOrders() async {
    setState(() {
      _isLoadingOrders = true;
    });
    try {
      final response = await ApiClient.instance.get(
        ApiEndpoints.workOrders,
        queryParameters: {'page': 1, 'size': 50, 'status': 'PENDING'},
      );
      final data = response.data as Map<String, dynamic>?;
      if (data != null) {
        final records = (data['list'] as List<dynamic>?)
                ?.map((e) => WorkOrderRef.fromJson(e as Map<String, dynamic>))
                .toList() ??
            [];
        setState(() {
          _pendingOrders.clear();
          _pendingOrders.addAll(records);
        });
      }
    } on DioException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message ?? '加载工单失败')),
        );
      }
    } finally {
      setState(() {
        _isLoadingOrders = false;
      });
    }
  }

  Future<void> _loadOperators() async {
    setState(() {
      _isLoadingOperators = true;
    });
    try {
      final response = await ApiClient.instance.get(
        ApiEndpoints.operators,
        queryParameters: {'available': true},
      );
      final data = response.data;
      if (data is List) {
        final list = data
            .map((e) => DispatchOperator.fromJson(e as Map<String, dynamic>))
            .toList();
        // Sort by rating descending for recommendation
        list.sort((a, b) => b.rating.compareTo(a.rating));
        setState(() {
          _operators.clear();
          _operators.addAll(list);
        });
      }
    } on DioException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message ?? '加载运维人员失败')),
        );
      }
    } finally {
      setState(() {
        _isLoadingOperators = false;
      });
    }
  }

  Future<void> _submitDispatch() async {
    if (_selectedOrder == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('请选择工单')),
      );
      return;
    }
    if (_selectedOperator == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('请选择运维人员')),
      );
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      await ApiClient.instance.post(
        ApiEndpoints.workOrderAssign
            .replaceAll('{id}', _selectedOrder!.id),
        data: {
          'operatorId': _selectedOperator!.id,
          'remark': _remarkController.text.trim(),
        },
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('派单成功'),
            backgroundColor: AppTheme.success,
          ),
        );
        // Reset form
        setState(() {
          _selectedOrder = null;
          _selectedOperator = null;
          _remarkController.clear();
        });
        // Refresh lists
        _loadPendingOrders();
        _loadOperators();
      }
    } on DioException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message ?? '派单失败')),
        );
      }
    } finally {
      setState(() {
        _isSubmitting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppTheme.spacingLg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Section: Select Work Order ─────────────
          _buildSectionHeader('选择工单', Icons.assignment_rounded),
          const SizedBox(height: AppTheme.spacingSm),
          _buildOrderSelector(),
          const SizedBox(height: AppTheme.spacingXl),

          // ── Section: Select Operator ───────────────
          _buildSectionHeader('选择运维人员', Icons.person_search_rounded),
          const SizedBox(height: AppTheme.spacingSm),
          _buildOperatorSelector(),
          const SizedBox(height: AppTheme.spacingXl),

          // ── Section: Remark ────────────────────────
          _buildSectionHeader('备注', Icons.notes_rounded),
          const SizedBox(height: AppTheme.spacingSm),
          TextField(
            controller: _remarkController,
            maxLines: 3,
            style: AppTheme.bodyMedium,
            decoration: const InputDecoration(
              hintText: '输入派单备注（可选）',
              alignLabelWithHint: true,
            ),
          ),
          const SizedBox(height: AppTheme.spacingXl),

          // ── Submit Button ──────────────────────────
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              onPressed: _isSubmitting ? null : _submitDispatch,
              child: _isSubmitting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2,
                      ),
                    )
                  : const Text('确认派单'),
            ),
          ),
          const SizedBox(height: AppTheme.spacingXxl),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppTheme.brandBlue),
        const SizedBox(width: AppTheme.spacingXs),
        Text(title, style: AppTheme.titleMedium),
      ],
    );
  }

  Widget _buildOrderSelector() {
    if (_isLoadingOrders && _pendingOrders.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(AppTheme.spacingXl),
        decoration: BoxDecoration(
          color: AppTheme.backgroundWhite,
          borderRadius: BorderRadius.circular(AppTheme.radiusLg),
          border: Border.all(color: AppTheme.border, width: 0.5),
        ),
        child: const Center(child: CircularProgressIndicator(color: AppTheme.brandBlue)),
      );
    }

    if (_pendingOrders.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(AppTheme.spacingXl),
        decoration: BoxDecoration(
          color: AppTheme.backgroundWhite,
          borderRadius: BorderRadius.circular(AppTheme.radiusLg),
          border: Border.all(color: AppTheme.border, width: 0.5),
        ),
        child: Center(
          child: Column(
            children: [
              const Icon(Icons.check_circle_outline_rounded, size: 32, color: AppTheme.success),
              const SizedBox(height: AppTheme.spacingSm),
              Text(
                '暂无待派单工单',
                style: AppTheme.bodySmall.copyWith(color: AppTheme.textSecondary),
              ),
            ],
          ),
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: AppTheme.backgroundWhite,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        border: Border.all(color: AppTheme.border, width: 0.5),
      ),
      child: Column(
        children: _pendingOrders.map((order) {
          final isSelected = _selectedOrder?.id == order.id;
          final priorityColor = _priorityColor(order.priority);

          return GestureDetector(
            onTap: () {
              setState(() {
                _selectedOrder = isSelected ? null : order;
              });
            },
            child: Container(
              padding: const EdgeInsets.all(AppTheme.spacingMd),
              decoration: BoxDecoration(
                color: isSelected
                    ? AppTheme.brandBlue.withOpacity(0.04)
                    : Colors.transparent,
                border: const Border(
                  bottom: BorderSide(color: AppTheme.divider, width: 0.5),
                ),
              ),
              child: Row(
                children: [
                  // Radio indicator
                  Container(
                    width: 20,
                    height: 20,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: isSelected ? AppTheme.brandBlue : AppTheme.textHint,
                        width: 2,
                      ),
                    ),
                    child: isSelected
                        ? const Center(
                            child: Icon(Icons.circle, size: 10, color: AppTheme.brandBlue),
                          )
                        : null,
                  ),
                  const SizedBox(width: AppTheme.spacingMd),
                  // Order info
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                order.orderNo,
                                style: AppTheme.bodySmall.copyWith(
                                  color: AppTheme.textSecondary,
                                ),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: AppTheme.spacingSm,
                                vertical: AppTheme.spacingXs,
                              ),
                              decoration: BoxDecoration(
                                color: priorityColor.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                              ),
                              child: Text(
                                order.priority,
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600,
                                  color: priorityColor,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: AppTheme.spacingXxs),
                        Text(
                          order.title,
                          style: AppTheme.bodyMedium,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: AppTheme.spacingXxs),
                        Text(
                          order.stationName,
                          style: AppTheme.caption,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildOperatorSelector() {
    if (_isLoadingOperators && _operators.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(AppTheme.spacingXl),
        decoration: BoxDecoration(
          color: AppTheme.backgroundWhite,
          borderRadius: BorderRadius.circular(AppTheme.radiusLg),
          border: Border.all(color: AppTheme.border, width: 0.5),
        ),
        child: const Center(child: CircularProgressIndicator(color: AppTheme.brandBlue)),
      );
    }

    if (_operators.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(AppTheme.spacingXl),
        decoration: BoxDecoration(
          color: AppTheme.backgroundWhite,
          borderRadius: BorderRadius.circular(AppTheme.radiusLg),
          border: Border.all(color: AppTheme.border, width: 0.5),
        ),
        child: Center(
          child: Text(
            '暂无可用运维人员',
            style: AppTheme.bodySmall.copyWith(color: AppTheme.textSecondary),
          ),
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: AppTheme.backgroundWhite,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        border: Border.all(color: AppTheme.border, width: 0.5),
      ),
      child: Column(
        children: _operators.map((operator) {
          final isSelected = _selectedOperator?.id == operator.id;
          final isTopRated = operator.rating >= 4.5;

          return GestureDetector(
            onTap: operator.available
                ? () {
                    setState(() {
                      _selectedOperator = isSelected ? null : operator;
                    });
                  }
                : null,
            child: Container(
              padding: const EdgeInsets.all(AppTheme.spacingMd),
              decoration: BoxDecoration(
                color: isSelected
                    ? AppTheme.brandBlue.withOpacity(0.04)
                    : Colors.transparent,
                border: const Border(
                  bottom: BorderSide(color: AppTheme.divider, width: 0.5),
                ),
              ),
              child: Row(
                children: [
                  // Radio indicator
                  Container(
                    width: 20,
                    height: 20,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: isSelected ? AppTheme.brandBlue : AppTheme.textHint,
                        width: 2,
                      ),
                    ),
                    child: isSelected
                        ? const Center(
                            child: Icon(Icons.circle, size: 10, color: AppTheme.brandBlue),
                          )
                        : null,
                  ),
                  const SizedBox(width: AppTheme.spacingMd),
                  // Avatar
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: AppTheme.brandBlue.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Icon(
                      Icons.person_rounded,
                      color: AppTheme.brandBlue,
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: AppTheme.spacingMd),
                  // Info
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              operator.name,
                              style: AppTheme.bodyMedium.copyWith(
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            if (isTopRated) ...[
                              const SizedBox(width: AppTheme.spacingXs),
                              const Icon(
                                Icons.star_rounded,
                                size: 14,
                                color: AppTheme.warning,
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: AppTheme.spacingXxs),
                        Row(
                          children: [
                            // Rating
                            Icon(Icons.star_rounded, size: 12, color: AppTheme.warning),
                            const SizedBox(width: 2),
                            Text(
                              operator.rating.toStringAsFixed(1),
                              style: AppTheme.caption.copyWith(
                                color: AppTheme.warning,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(width: AppTheme.spacingSm),
                            // Active orders
                            Text(
                              '进行中 ${operator.activeOrders}',
                              style: AppTheme.caption,
                            ),
                            const SizedBox(width: AppTheme.spacingSm),
                            // Completed
                            Text(
                              '已完成 ${operator.completedOrders}',
                              style: AppTheme.caption,
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  // Availability indicator
                  if (!operator.available)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppTheme.spacingSm,
                        vertical: AppTheme.spacingXxs,
                      ),
                      decoration: BoxDecoration(
                        color: AppTheme.error.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                      ),
                      child: const Text(
                        '忙碌',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w500,
                          color: AppTheme.error,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

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
}

// ──────────────────────────────────────────────────────────────
// Tab 3: Dispatch History
// ──────────────────────────────────────────────────────────────

class _DispatchHistoryTab extends StatefulWidget {
  const _DispatchHistoryTab();

  @override
  State<_DispatchHistoryTab> createState() => _DispatchHistoryTabState();
}

class _DispatchHistoryTabState extends State<_DispatchHistoryTab> {
  final List<DispatchRecord> _records = [];
  int _currentPage = 1;
  static const int _pageSize = 20;
  int _total = 0;
  bool _isLoading = false;
  bool _hasMore = true;
  String? _errorMessage;

  final RefreshController _refreshController = RefreshController(
    initialRefresh: false,
  );
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    _loadData(isRefresh: true);
  }

  @override
  void dispose() {
    _refreshController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      if (!_isLoading && _hasMore) {
        _loadData(isRefresh: false);
      }
    }
  }

  Future<void> _loadData({required bool isRefresh}) async {
    if (_isLoading) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    if (isRefresh) {
      _currentPage = 1;
      _hasMore = true;
    }

    try {
      final response = await ApiClient.instance.get(
        ApiEndpoints.dispatchRecords,
        queryParameters: {
          'page': _currentPage,
          'size': _pageSize,
        },
      );

      final data = response.data as Map<String, dynamic>?;
      if (data != null) {
        final records = (data['list'] as List<dynamic>?)
                ?.map((e) => DispatchRecord.fromJson(e as Map<String, dynamic>))
                .toList() ??
            [];
        final total = data['total'] as int? ?? 0;

        setState(() {
          if (isRefresh) {
            _records.clear();
          }
          _records.addAll(records);
          _total = total;
          _currentPage++;
          _hasMore = _records.length < _total;
        });
      }
    } on DioException catch (e) {
      setState(() {
        _errorMessage = e.message ?? '加载失败';
      });
    } catch (_) {
      setState(() {
        _errorMessage = '加载失败，请重试';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
      if (isRefresh) {
        _refreshController.refreshCompleted();
      } else {
        _refreshController.loadComplete();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_errorMessage != null && _records.isEmpty) {
      return ErrorRetryWidget(
        message: _errorMessage!,
        onRetry: () => _loadData(isRefresh: true),
      );
    }

    if (!_isLoading && _records.isEmpty) {
      return const EmptyState(
        icon: Icons.history_rounded,
        title: '暂无派单记录',
        subtitle: '完成派单后将在此显示历史记录',
      );
    }

    return SmartRefresher(
      controller: _refreshController,
      enablePullDown: true,
      enablePullUp: _hasMore,
      onRefresh: () => _loadData(isRefresh: true),
      onLoading: () async {
        if (_hasMore) {
          await _loadData(isRefresh: false);
        } else {
          _refreshController.loadNoData();
        }
      },
      header: const ClassicHeader(
        idleText: '下拉刷新',
        refreshingText: '正在刷新...',
        completeText: '刷新完成',
        failedText: '刷新失败，点击重试',
      ),
      footer: const ClassicFooter(
        idleText: '上拉加载更多',
        loadingText: '正在加载...',
        noDataText: '没有更多数据了',
        canLoadingText: '释放加载更多',
        failedText: '加载失败，点击重试',
      ),
      child: ListView.builder(
        controller: _scrollController,
        padding: const EdgeInsets.symmetric(vertical: AppTheme.spacingSm),
        itemCount: _records.length,
        itemBuilder: (context, index) => _buildRecordCard(_records[index]),
      ),
    );
  }

  Widget _buildRecordCard(DispatchRecord record) {
    final isAuto = record.dispatchType.toUpperCase() == 'AUTO';
    final statusColor = _statusColor(record.status);

    return GestureDetector(
      onTap: () {
        context.pushNamed(
          RouteNames.workOrderDetail,
          pathParameters: {'id': record.workOrderId},
        );
      },
      child: Container(
        margin: const EdgeInsets.symmetric(
          horizontal: AppTheme.spacingLg,
          vertical: AppTheme.spacingSm,
        ),
        decoration: BoxDecoration(
          color: AppTheme.backgroundWhite,
          borderRadius: BorderRadius.circular(AppTheme.radiusLg),
          border: Border.all(color: AppTheme.border, width: 0.5),
        ),
        child: Padding(
          padding: const EdgeInsets.all(AppTheme.spacingLg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Row 1: Work order no + dispatch type
              Row(
                children: [
                  Expanded(
                    child: Text(
                      record.workOrderNo,
                      style: AppTheme.bodySmall.copyWith(
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppTheme.spacingSm,
                      vertical: AppTheme.spacingXs,
                    ),
                    decoration: BoxDecoration(
                      color: isAuto
                          ? AppTheme.brandBlue.withOpacity(0.08)
                          : AppTheme.success.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                    ),
                    child: Text(
                      isAuto ? '自动派单' : '手动派单',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                        color: isAuto ? AppTheme.brandBlue : AppTheme.success,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppTheme.spacingSm),
              // Row 2: Title
              Text(
                record.workOrderTitle,
                style: AppTheme.bodyMedium.copyWith(
                  fontWeight: FontWeight.w500,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: AppTheme.spacingSm),
              // Row 3: Operator + status + time
              Row(
                children: [
                  const Icon(
                    Icons.person_outline_rounded,
                    size: 14,
                    color: AppTheme.textSecondary,
                  ),
                  const SizedBox(width: AppTheme.spacingXxs),
                  Text(
                    record.operatorName,
                    style: AppTheme.bodySmall,
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppTheme.spacingSm,
                      vertical: AppTheme.spacingXxs,
                    ),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                    ),
                    child: Text(
                      _statusLabel(record.status),
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w500,
                        color: statusColor,
                      ),
                    ),
                  ),
                  const SizedBox(width: AppTheme.spacingSm),
                  Text(
                    _formatTime(record.dispatchedAt),
                    style: AppTheme.caption,
                  ),
                ],
              ),
              // Row 4: Remark (if any)
              if (record.remark != null && record.remark!.isNotEmpty) ...[
                const SizedBox(height: AppTheme.spacingSm),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(AppTheme.spacingSm),
                  decoration: BoxDecoration(
                    color: AppTheme.backgroundLight,
                    borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                  ),
                  child: Text(
                    record.remark!,
                    style: AppTheme.bodySmall.copyWith(
                      color: AppTheme.textSecondary,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Color _statusColor(String status) {
    switch (status.toUpperCase()) {
      case 'ACCEPTED':
        return AppTheme.success;
      case 'PENDING':
        return AppTheme.warning;
      case 'EXPIRED':
        return AppTheme.error;
      default:
        return AppTheme.info;
    }
  }

  String _statusLabel(String status) {
    switch (status.toUpperCase()) {
      case 'ACCEPTED':
        return '已接单';
      case 'PENDING':
        return '待接单';
      case 'EXPIRED':
        return '已过期';
      default:
        return status;
    }
  }

  String _formatTime(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inMinutes < 1) return '刚刚';
    if (diff.inMinutes < 60) return '${diff.inMinutes}分钟前';
    if (diff.inHours < 24) return '${diff.inHours}小时前';
    if (diff.inDays < 7) return '${diff.inDays}天前';
    return '${dt.month.toString().padLeft(2, '0')}-${dt.day.toString().padLeft(2, '0')}';
  }
}

// ──────────────────────────────────────────────────────────────
// Shared helper widgets
// ──────────────────────────────────────────────────────────────

class _TagChip extends StatelessWidget {
  final String label;
  final Color color;

  const _TagChip({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppTheme.spacingSm,
        vertical: AppTheme.spacingXs,
      ),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(AppTheme.radiusSm),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w500,
          color: color,
        ),
      ),
    );
  }
}
