import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:pull_to_refresh/pull_to_refresh.dart';
import 'package:intl/intl.dart';

import 'package:ops_flutter/core/network/api_client.dart';
import 'package:ops_flutter/core/network/api_endpoints.dart';
import 'package:ops_flutter/core/router/app_router.dart';
import 'package:ops_flutter/core/theme/app_theme.dart';
import 'package:ops_flutter/features/alert/models/alert_models.dart';
import 'package:ops_flutter/shared/widgets/common_widgets.dart';

/// Alert list page with level tabs, pull-to-refresh, and pagination.
class AlertListPage extends StatefulWidget {
  const AlertListPage({super.key});

  @override
  State<AlertListPage> createState() => _AlertListPageState();
}

class _AlertListPageState extends State<AlertListPage>
    with SingleTickerProviderStateMixin {
  // ── Tab controller ───────────────────────────────────────────
  late TabController _tabController;

  static const _tabs = [
    Tab(text: '全部'),
    Tab(text: 'P0 紧急'),
    Tab(text: 'P1 严重'),
    Tab(text: 'P2 一般'),
    Tab(text: 'P3 提示'),
  ];

  static const _levelFilters = ['', 'P0', 'P1', 'P2', 'P3'];

  // ── Pagination state ─────────────────────────────────────────
  final List<AlertRecord> _alerts = [];
  int _currentPage = 1;
  static const int _pageSize = 20;
  int _total = 0;
  bool _isLoading = false;
  bool _hasMore = true;

  // ── Pull-to-refresh ──────────────────────────────────────────
  final RefreshController _refreshController = RefreshController(
    initialRefresh: false,
  );

  // ── Error state ──────────────────────────────────────────────
  String? _errorMessage;

  String get _currentLevel => _levelFilters[_tabController.index];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
    _tabController.addListener(_onTabChanged);
    _loadData(isRefresh: true);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _refreshController.dispose();
    super.dispose();
  }

  // ── Tab change handler ──────────────────────────────────────
  void _onTabChanged() {
    if (_tabController.indexIsChanging) {
      _loadData(isRefresh: true);
    }
  }

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
      final params = <String, dynamic>{
        'page': _currentPage,
        'size': _pageSize,
        'status': 'pending',
      };
      if (_currentLevel.isNotEmpty) {
        params['level'] = _currentLevel;
      }

      final response = await ApiClient.instance.get(
        ApiEndpoints.alerts,
        queryParameters: params,
      );

      final data = response.data as Map<String, dynamic>?;
      if (data != null) {
        final records = (data['list'] as List<dynamic>?)
                ?.map((e) => AlertRecord.fromJson(e as Map<String, dynamic>))
                .toList() ??
            [];
        final total = data['total'] as int? ?? 0;

        setState(() {
          if (isRefresh) {
            _alerts.clear();
          }
          _alerts.addAll(records);
          _total = total;
          _currentPage++;
          _hasMore = _alerts.length < _total;
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

  // ── Pull-to-refresh callback ─────────────────────────────────
  Future<void> _onRefresh() async {
    await _loadData(isRefresh: true);
  }

  // ── Load more callback ───────────────────────────────────────
  Future<void> _onLoading() async {
    if (_hasMore) {
      await _loadData(isRefresh: false);
    } else {
      _refreshController.loadNoData();
    }
  }

  // ── Handle alert actions ─────────────────────────────────────
  Future<void> _handleAlert(AlertRecord alert) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('确认处理'),
        content: Text('确认处理告警「${alert.title}」？'),
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
          ApiEndpoints.alertHandle('${alert.id}'),
          data: {'handler': 'ops', 'result': '已处理'},
        );
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('告警已处理')),
          );
          _loadData(isRefresh: true);
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

  Future<void> _ignoreAlert(AlertRecord alert) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('确认忽略'),
        content: Text('确认忽略告警「${alert.title}」？忽略后将不再提示。'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('取消'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('确认忽略'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await ApiClient.instance.post(
          ApiEndpoints.alertIgnore('${alert.id}'),
        );
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('告警已忽略')),
          );
          _loadData(isRefresh: true);
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

  // ── Build ────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        title: const Text('告警中心'),
        bottom: TabBar(
          controller: _tabController,
          tabs: _tabs,
          isScrollable: true,
          labelColor: AppTheme.brandBlue,
          unselectedLabelColor: AppTheme.textSecondary,
          indicatorColor: AppTheme.brandBlue,
          indicatorSize: TabBarIndicatorSize.label,
          labelStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
          unselectedLabelStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w400,
          ),
        ),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_errorMessage != null && _alerts.isEmpty) {
      return ErrorRetryWidget(
        message: _errorMessage!,
        onRetry: () => _loadData(isRefresh: true),
      );
    }

    if (!_isLoading && _alerts.isEmpty) {
      return const EmptyState(
        icon: Icons.notifications_none_rounded,
        title: '暂无告警',
        subtitle: '当前没有待处理的告警',
      );
    }

    return SmartRefresher(
      controller: _refreshController,
      enablePullDown: true,
      enablePullUp: _hasMore,
      onRefresh: _onRefresh,
      onLoading: _onLoading,
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
        padding: const EdgeInsets.symmetric(vertical: AppTheme.spacingSm),
        itemCount: _alerts.length,
        itemBuilder: (context, index) {
          return _AlertCard(
            alert: _alerts[index],
            onProcess: () => _handleAlert(_alerts[index]),
            onIgnore: () => _ignoreAlert(_alerts[index]),
          );
        },
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────
// Alert Card
// ──────────────────────────────────────────────────────────────

class _AlertCard extends StatelessWidget {
  final AlertRecord alert;
  final VoidCallback onProcess;
  final VoidCallback onIgnore;

  const _AlertCard({
    required this.alert,
    required this.onProcess,
    required this.onIgnore,
  });

  Color get _levelColor {
    switch (alert.level) {
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

  String get _levelLabel {
    switch (alert.level) {
      case 'P0':
        return '紧急';
      case 'P1':
        return '严重';
      case 'P2':
        return '一般';
      case 'P3':
        return '提示';
      default:
        return alert.level;
    }
  }

  String _formatTime(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inMinutes < 1) return '刚刚';
    if (diff.inMinutes < 60) return '${diff.inMinutes}分钟前';
    if (diff.inHours < 24) return '${diff.inHours}小时前';
    if (diff.inDays < 7) return '${diff.inDays}天前';
    return DateFormat('MM-dd HH:mm').format(dt);
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        context.pushNamed(
          RouteNames.alertDetail,
          pathParameters: {'id': '${alert.id}'},
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
              // ── Left color bar ──────────────────────────────
              Container(
                width: 4,
                decoration: BoxDecoration(
                  color: _levelColor,
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
                      // ── Row 1: Level tag + Title ──────────
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: AppTheme.spacingSm,
                              vertical: AppTheme.spacingXxs,
                            ),
                            decoration: BoxDecoration(
                              color: _levelColor.withValues(alpha: 0.1),
                              borderRadius:
                                  BorderRadius.circular(AppTheme.radiusSm),
                            ),
                            child: Text(
                              '${alert.level} $_levelLabel',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: _levelColor,
                              ),
                            ),
                          ),
                          const SizedBox(width: AppTheme.spacingSm),
                          Expanded(
                            child: Text(
                              alert.title,
                              style: AppTheme.titleMedium,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: AppTheme.spacingSm),
                      // ── Row 2: Device code ─────────────────
                      Row(
                        children: [
                          Icon(
                            Icons.memory_rounded,
                            size: 14,
                            color: AppTheme.textSecondary,
                          ),
                          const SizedBox(width: AppTheme.spacingXs),
                          Text(
                            alert.deviceCode,
                            style: AppTheme.bodySmall.copyWith(
                              fontFamily: 'monospace',
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: AppTheme.spacingSm),
                      // ── Row 3: Station + time ─────────────
                      Row(
                        children: [
                          Icon(
                            Icons.location_on_outlined,
                            size: 14,
                            color: AppTheme.textSecondary,
                          ),
                          const SizedBox(width: AppTheme.spacingXs),
                          Expanded(
                            child: Text(
                              alert.stationName,
                              style: AppTheme.bodySmall,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          Text(
                            _formatTime(alert.createdAt),
                            style: AppTheme.caption,
                          ),
                        ],
                      ),
                      const SizedBox(height: AppTheme.spacingMd),
                      // ── Row 4: Action buttons ─────────────
                      if (alert.isPending)
                        Row(
                          children: [
                            Expanded(
                              child: SizedBox(
                                height: 32,
                                child: ElevatedButton(
                                  onPressed: onProcess,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppTheme.brandBlue,
                                    foregroundColor: AppTheme.textWhite,
                                    padding: EdgeInsets.zero,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(
                                        AppTheme.radiusSm,
                                      ),
                                    ),
                                    textStyle: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  child: const Text('处理'),
                                ),
                              ),
                            ),
                            const SizedBox(width: AppTheme.spacingSm),
                            Expanded(
                              child: SizedBox(
                                height: 32,
                                child: OutlinedButton(
                                  onPressed: onIgnore,
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: AppTheme.textSecondary,
                                    side: const BorderSide(
                                      color: AppTheme.border,
                                    ),
                                    padding: EdgeInsets.zero,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(
                                        AppTheme.radiusSm,
                                      ),
                                    ),
                                    textStyle: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  child: const Text('忽略'),
                                ),
                              ),
                            ),
                          ],
                        )
                      else
                        Align(
                          alignment: Alignment.centerRight,
                          child: StatusTag(
                            text: alert.status == 'resolved' ? '已处理' : '已忽略',
                            color: alert.status == 'resolved'
                                ? AppTheme.success
                                : AppTheme.textSecondary,
                          ),
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
