import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:pull_to_refresh/pull_to_refresh.dart';

import 'package:ops_flutter/core/network/api_client.dart';
import 'package:ops_flutter/core/network/api_endpoints.dart';
import 'package:ops_flutter/core/router/app_router.dart';
import 'package:ops_flutter/core/theme/app_theme.dart';
import 'package:ops_flutter/features/workorder/workorder_model.dart';
import 'package:ops_flutter/shared/widgets/common_widgets.dart';

/// Work order list page with tab filtering and pull-to-refresh.
class WorkOrderListPage extends StatefulWidget {
  const WorkOrderListPage({super.key});

  @override
  State<WorkOrderListPage> createState() => _WorkOrderListPageState();
}

class _WorkOrderListPageState extends State<WorkOrderListPage>
    with SingleTickerProviderStateMixin {
  // ── Tab state ──────────────────────────────────────────────────
  late TabController _tabController;
  static const _tabs = ['全部', '待接单', '处理中', '已完成'];
  static const _tabStatusValues = ['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'];

  // ── Pagination state ─────────────────────────────────────────
  final List<WorkOrder> _orders = [];
  int _currentPage = 1;
  static const int _pageSize = 20;
  int _total = 0;
  bool _isLoading = false;
  bool _hasMore = true;

  // ── Search ───────────────────────────────────────────────────
  final TextEditingController _searchController = TextEditingController();
  String _keyword = '';
  Timer? _debounceTimer;

  // ── Pull-to-refresh ──────────────────────────────────────────
  final RefreshController _refreshController = RefreshController(
    initialRefresh: false,
  );

  // ── Scroll controller for load-more ──────────────────────────
  final ScrollController _scrollController = ScrollController();

  // ── Error state ──────────────────────────────────────────────
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
    _tabController.addListener(_onTabChanged);
    _scrollController.addListener(_onScroll);
    _loadData(isRefresh: true);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    _refreshController.dispose();
    _scrollController.dispose();
    _debounceTimer?.cancel();
    super.dispose();
  }

  void _onTabChanged() {
    if (!_tabController.indexIsChanging) return;
    setState(() {
      _orders.clear();
      _currentPage = 1;
      _hasMore = true;
    });
    _loadData(isRefresh: true);
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      if (!_isLoading && _hasMore) {
        _loadData(isRefresh: false);
      }
    }
  }

  String get _currentStatus => _tabStatusValues[_tabController.index];

  // ── Data loading ─────────────────────────────────────────────
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
        ApiEndpoints.workOrders,
        queryParameters: {
          'page': _currentPage,
          'size': _pageSize,
          'status': _currentStatus,
          if (_keyword.isNotEmpty) 'keyword': _keyword,
        },
      );

      final data = response.data as Map<String, dynamic>?;
      if (data != null) {
        final records = (data['list'] as List<dynamic>?)
                ?.map((e) => WorkOrder.fromJson(e as Map<String, dynamic>))
                .toList() ??
            [];
        final total = data['total'] as int? ?? 0;

        setState(() {
          if (isRefresh) {
            _orders.clear();
          }
          _orders.addAll(records);
          _total = total;
          _currentPage++;
          _hasMore = _orders.length < _total;
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
      if (isRefresh) {
        _refreshController.refreshCompleted();
      } else {
        _refreshController.loadComplete();
      }
    }
  }

  // ── Search handling with debounce ────────────────────────────
  void _onSearchChanged(String value) {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 500), () {
      setState(() {
        _keyword = value.trim();
      });
      _loadData(isRefresh: true);
    });
  }

  void _onSearchClear() {
    _searchController.clear();
    setState(() {
      _keyword = '';
    });
    _loadData(isRefresh: true);
  }

  // ── Actions ──────────────────────────────────────────────────
  Future<void> _acceptOrder(WorkOrder order) async {
    try {
      await ApiClient.instance.post(
        ApiEndpoints.workOrderAccept(order.id),
      );
      _loadData(isRefresh: true);
    } on DioException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message ?? '接单失败')),
        );
      }
    }
  }

  // ── Build ────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        title: const Text('工单管理'),
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
      body: Column(
        children: [
          _buildSearchBar(),
          Expanded(child: _buildBody()),
        ],
      ),
    );
  }

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
          hintText: '搜索工单号、标题或站点',
          hintStyle: AppTheme.bodyMedium.copyWith(color: AppTheme.textHint),
          prefixIcon: const Icon(
            Icons.search_rounded,
            color: AppTheme.textHint,
            size: 20,
          ),
          suffixIcon: _searchController.text.isNotEmpty
              ? IconButton(
                  icon: const Icon(
                    Icons.cancel_rounded,
                    color: AppTheme.textHint,
                    size: 18,
                  ),
                  onPressed: _onSearchClear,
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

  Widget _buildBody() {
    if (_errorMessage != null && _orders.isEmpty) {
      return ErrorRetryWidget(
        message: _errorMessage!,
        onRetry: () => _loadData(isRefresh: true),
      );
    }

    if (!_isLoading && _orders.isEmpty && _keyword.isNotEmpty) {
      return EmptyState(
        icon: Icons.search_off_rounded,
        title: '未找到相关工单',
        subtitle: '请尝试其他关键词',
        actionLabel: '清除搜索',
        onAction: _onSearchClear,
      );
    }

    if (!_isLoading && _orders.isEmpty) {
      return const EmptyState(
        icon: Icons.assignment_rounded,
        title: '暂无工单',
        subtitle: '当前没有工单数据',
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
        itemCount: _orders.length,
        itemBuilder: (context, index) => WorkOrderCard(
          order: _orders[index],
          onAccept: _acceptOrder,
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────
// Work Order Card
// ──────────────────────────────────────────────────────────────

class WorkOrderCard extends StatelessWidget {
  final WorkOrder order;
  final void Function(WorkOrder order)? onAccept;

  const WorkOrderCard({
    super.key,
    required this.order,
    this.onAccept,
  });

  static Color _priorityColor(String priority) {
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

  static String _priorityLabel(String priority) {
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

  static String _typeLabel(String type) {
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

  @override
  Widget build(BuildContext context) {
    final priorityColor = _priorityColor(order.priority);
    final canAccept = order.status.toUpperCase() == 'PENDING';

    return GestureDetector(
      onTap: () {
        context.pushNamed(
          RouteNames.workOrderDetail,
          pathParameters: {'id': order.id},
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
        child: IntrinsicHeight(
          child: Row(
            children: [
              // ── Left priority bar ──────────────────────────
              Container(
                width: 4,
                decoration: BoxDecoration(
                  color: priorityColor,
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(AppTheme.radiusLg),
                    bottomLeft: Radius.circular(AppTheme.radiusLg),
                  ),
                ),
              ),
              // ── Content ────────────────────────────────────
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(AppTheme.spacingLg),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // ── Row 1: Order No + Type tag ──────────
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
                              color: AppTheme.brandBlue.withValues(alpha: 0.08),
                              borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                            ),
                            child: Text(
                              _typeLabel(order.type),
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w500,
                                color: AppTheme.brandBlue,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: AppTheme.spacingSm),
                      // ── Row 2: Title ────────────────────────
                      Text(
                        order.title,
                        style: AppTheme.titleMedium,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: AppTheme.spacingXs),
                      // ── Row 3: Station + Device ─────────────
                      Row(
                        children: [
                          const Icon(
                            Icons.location_on_outlined,
                            size: 14,
                            color: AppTheme.textSecondary,
                          ),
                          const SizedBox(width: AppTheme.spacingXxs),
                          Expanded(
                            child: Text(
                              order.stationName,
                              style: AppTheme.bodySmall,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (order.deviceCode.isNotEmpty) ...[
                            const SizedBox(width: AppTheme.spacingSm),
                            const Icon(
                              Icons.ev_station_rounded,
                              size: 14,
                              color: AppTheme.textSecondary,
                            ),
                            const SizedBox(width: AppTheme.spacingXxs),
                            Expanded(
                              child: Text(
                                order.deviceCode,
                                style: AppTheme.bodySmall,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: AppTheme.spacingMd),
                      // ── Row 4: Priority + Status + Time ────
                      Row(
                        children: [
                          // Priority badge
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
                              '${_priorityLabel(order.priority)}优先级',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w500,
                                color: priorityColor,
                              ),
                            ),
                          ),
                          const SizedBox(width: AppTheme.spacingSm),
                          // Status
                          StatusTag.fromStatus(status: order.status),
                          const Spacer(),
                          // Time
                          Text(
                            _formatTime(order.createdAt),
                            style: AppTheme.caption,
                          ),
                        ],
                      ),
                      // ── Row 5: Action buttons ──────────────
                      if (canAccept) ...[
                        const SizedBox(height: AppTheme.spacingMd),
                        Row(
                          children: [
                            const Spacer(),
                            SizedBox(
                              height: 32,
                              child: OutlinedButton(
                                onPressed: () {
                                  context.pushNamed(
                                    RouteNames.workOrderDetail,
                                    pathParameters: {'id': order.id},
                                  );
                                },
                                style: OutlinedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(horizontal: 12),
                                  textStyle: const TextStyle(fontSize: 12),
                                  side: const BorderSide(color: AppTheme.border),
                                  foregroundColor: AppTheme.textSecondary,
                                ),
                                child: const Text('查看详情'),
                              ),
                            ),
                            const SizedBox(width: AppTheme.spacingSm),
                            SizedBox(
                              height: 32,
                              child: ElevatedButton(
                                onPressed: () => onAccept?.call(order),
                                style: ElevatedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(horizontal: 12),
                                  textStyle: const TextStyle(fontSize: 12),
                                ),
                                child: const Text('接单'),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
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
