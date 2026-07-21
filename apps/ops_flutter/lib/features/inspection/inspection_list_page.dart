import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:pull_to_refresh/pull_to_refresh.dart';

import 'package:ops_flutter/core/network/api_client.dart';
import 'package:ops_flutter/core/network/api_endpoints.dart';
import 'package:ops_flutter/core/router/app_router.dart';
import 'package:ops_flutter/core/theme/app_theme.dart';
import 'package:ops_flutter/features/inspection/inspection_model.dart';
import 'package:ops_flutter/shared/widgets/common_widgets.dart';

/// Inspection task list page with tab filtering and pull-to-refresh.
class InspectionListPage extends StatefulWidget {
  const InspectionListPage({super.key});

  @override
  State<InspectionListPage> createState() => _InspectionListPageState();
}

class _InspectionListPageState extends State<InspectionListPage>
    with SingleTickerProviderStateMixin {
  // ── Tab state ──────────────────────────────────────────────────
  late TabController _tabController;
  static const _tabs = ['全部', '待巡检', '巡检中', '已完成'];
  static const _tabStatusValues = ['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'];

  // ── Pagination state ─────────────────────────────────────────
  final List<InspectionTask> _tasks = [];
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
      _tasks.clear();
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
        ApiEndpoints.inspections,
        queryParameters: {
          'page': _currentPage,
          'size': _pageSize,
          'status': _currentStatus,
          if (_keyword.isNotEmpty) 'keyword': _keyword,
        },
      );

      final data = response.data;
      List<InspectionTask> records = [];
      int total = 0;

      if (data is List) {
        // 后端 InspectionController 返回 R<List<InspectionTaskVO>>（纯列表，无分页）
        records = data
            .map((e) => InspectionTask.fromJson(e as Map<String, dynamic>))
            .toList();
        total = records.length;
      } else if (data is Map<String, dynamic>) {
        // 兼容分页格式 { list: [...], total: N }
        records = ((data['list'] ?? data['records']) as List<dynamic>?)
                ?.map((e) => InspectionTask.fromJson(e as Map<String, dynamic>))
                .toList() ??
            [];
        total = data['total'] as int? ?? records.length;
      }

      setState(() {
        if (isRefresh) {
          _tasks.clear();
        }
        _tasks.addAll(records);
        _total = total;
        _currentPage++;
        _hasMore = _tasks.length < _total;
      });
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

  // ── Build ────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        title: const Text('巡检任务'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 20),
          onPressed: () => context.pop(),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, size: 22),
            onPressed: () => _loadData(isRefresh: true),
          ),
        ],
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
          hintText: '搜索任务名称、站点',
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
    if (_errorMessage != null && _tasks.isEmpty) {
      return ErrorRetryWidget(
        message: _errorMessage!,
        onRetry: () => _loadData(isRefresh: true),
      );
    }

    if (!_isLoading && _tasks.isEmpty && _keyword.isNotEmpty) {
      return EmptyState(
        icon: Icons.search_off_rounded,
        title: '未找到相关巡检任务',
        subtitle: '请尝试其他关键词',
        actionLabel: '清除搜索',
        onAction: _onSearchClear,
      );
    }

    if (!_isLoading && _tasks.isEmpty) {
      return const EmptyState(
        icon: Icons.fact_check_rounded,
        title: '暂无巡检任务',
        subtitle: '当前没有巡检任务数据',
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
        itemCount: _tasks.length,
        itemBuilder: (context, index) => InspectionTaskCard(
          task: _tasks[index],
          onTap: (task) {
            if (task.isCompleted) {
              context.pushNamed(
                RouteNames.inspectionDetail,
                pathParameters: {'id': task.id},
              );
            } else {
              context.push('/inspection/${task.id}/execute');
            }
          },
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────
// Inspection Task Card
// ──────────────────────────────────────────────────────────────

class InspectionTaskCard extends StatelessWidget {
  final InspectionTask task;
  final void Function(InspectionTask task)? onTap;

  const InspectionTaskCard({
    super.key,
    required this.task,
    this.onTap,
  });

  Color _statusColor(String status) {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return AppTheme.success;
      case 'IN_PROGRESS':
        return AppTheme.brandBlue;
      case 'PENDING':
        return AppTheme.warning;
      case 'CANCELLED':
        return AppTheme.error;
      default:
        return AppTheme.info;
    }
  }

  String _statusLabel(String status) {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return '已完成';
      case 'IN_PROGRESS':
        return '巡检中';
      case 'PENDING':
        return '待巡检';
      case 'CANCELLED':
        return '已取消';
      default:
        return status;
    }
  }

  @override
  Widget build(BuildContext context) {
    final statusColor = _statusColor(task.status);
    final canStart = task.isPending;
    final isReport = task.isCompleted;

    return GestureDetector(
      onTap: () => onTap?.call(task),
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
              // ── Left status bar ──────────────────────────
              Container(
                width: 4,
                decoration: BoxDecoration(
                  color: statusColor,
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(AppTheme.radiusLg),
                    bottomLeft: Radius.circular(AppTheme.radiusLg),
                  ),
                ),
              ),
              // ── Content ──────────────────────────────────
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(AppTheme.spacingLg),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // ── Row 1: Task name + Status ─────────
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              task.name,
                              style: AppTheme.titleMedium,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: AppTheme.spacingSm,
                              vertical: AppTheme.spacingXs,
                            ),
                            decoration: BoxDecoration(
                              color: statusColor.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                            ),
                            child: Text(
                              _statusLabel(task.status),
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                                color: statusColor,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: AppTheme.spacingSm),

                      // ── Row 2: Station ────────────────────
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
                              task.stationName,
                              style: AppTheme.bodySmall,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: AppTheme.spacingMd),

                      // ── Row 3: Progress bar ───────────────
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      '巡检进度',
                                      style: AppTheme.bodySmall,
                                    ),
                                    Text(
                                      '${task.deviceCount}/${task.itemCount}',
                                      style: AppTheme.numberSmall.copyWith(
                                        color: AppTheme.brandBlue,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: AppTheme.spacingXs),
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                                  child: LinearProgressIndicator(
                                    value: task.progress,
                                    minHeight: 6,
                                    backgroundColor: AppTheme.backgroundLight,
                                    valueColor: AlwaysStoppedAnimation<Color>(
                                      task.progress >= 1.0
                                          ? AppTheme.success
                                          : AppTheme.brandBlue,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: AppTheme.spacingMd),

                      // ── Row 4: Time + Actions ─────────────
                      Row(
                        children: [
                          const Icon(
                            Icons.access_time_rounded,
                            size: 13,
                            color: AppTheme.textSecondary,
                          ),
                          const SizedBox(width: AppTheme.spacingXxs),
                          Text(
                            task.planTime != null ? DateFormat('MM-dd HH:mm').format(task.planTime!) : '--',
                            style: AppTheme.caption,
                          ),
                          const Spacer(),
                          if (canStart)
                            SizedBox(
                              height: 30,
                              child: ElevatedButton(
                                onPressed: () => onTap?.call(task),
                                style: ElevatedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(horizontal: 10),
                                  textStyle: const TextStyle(fontSize: 12),
                                ),
                                child: const Text('开始巡检'),
                              ),
                            ),
                          if (isReport)
                            SizedBox(
                              height: 30,
                              child: OutlinedButton(
                                onPressed: () => onTap?.call(task),
                                style: OutlinedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(horizontal: 10),
                                  textStyle: const TextStyle(fontSize: 12),
                                  side: const BorderSide(color: AppTheme.border),
                                  foregroundColor: AppTheme.brandBlue,
                                ),
                                child: const Text('查看报告'),
                              ),
                            ),
                        ],
                      ),
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
}
