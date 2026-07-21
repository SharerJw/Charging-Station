import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:pull_to_refresh/pull_to_refresh.dart';

import 'package:ops_flutter/core/network/api_client.dart';
import 'package:ops_flutter/core/network/api_endpoints.dart';
import 'package:ops_flutter/core/router/app_router.dart';
import 'package:ops_flutter/core/theme/app_theme.dart';
import 'package:ops_flutter/features/station/models/station.dart';
import 'package:ops_flutter/shared/widgets/common_widgets.dart';

/// Station management page with search, pull-to-refresh, and load-more.
class StationPage extends StatefulWidget {
  const StationPage({super.key});

  @override
  State<StationPage> createState() => _StationPageState();
}

class _StationPageState extends State<StationPage> {
  // ── Pagination state ─────────────────────────────────────────
  final List<Station> _stations = [];
  int _currentPage = 1;
  static const int _pageSize = 20;
  int _total = 0;
  bool _isLoading = false;
  bool _hasMore = true;

  // ── Search ───────────────────────────────────────────────────
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();
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
    _scrollController.addListener(_onScroll);
    _loadData(isRefresh: true);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _searchFocusNode.dispose();
    _refreshController.dispose();
    _scrollController.dispose();
    _debounceTimer?.cancel();
    super.dispose();
  }

  // ── Scroll listener for load-more ────────────────────────────
  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      if (!_isLoading && _hasMore) {
        _loadData(isRefresh: false);
      }
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
      final response = await ApiClient.instance.get(
        ApiEndpoints.stations,
        queryParameters: {
          'page': _currentPage,
          'size': _pageSize,
          if (_keyword.isNotEmpty) 'keyword': _keyword,
        },
      );

      final data = response.data;
      List<Station> records = [];
      int total = 0;

      if (data is List) {
        // 后端 OpsStationController 返回 R<List<StationVO>>（纯列表，无分页）
        records = data
            .map((e) => Station.fromJson(e as Map<String, dynamic>))
            .toList();
        total = records.length;
      } else if (data is Map<String, dynamic>) {
        // 兼容分页格式 { list: [...], total: N }
        records = ((data['list'] ?? data['records']) as List<dynamic>?)
                ?.map((e) => Station.fromJson(e as Map<String, dynamic>))
                .toList() ??
            [];
        total = data['total'] as int? ?? records.length;
      }

      setState(() {
        if (isRefresh) {
          _stations.clear();
        }
        _stations.addAll(records);
        _total = total;
        _currentPage++;
        _hasMore = _stations.length < _total;
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

  // ── Build ────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        title: const Text('充电站管理'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 20),
          onPressed: () => context.pop(),
        ),
      ),
      body: Column(
        children: [
          // ── Search bar ──────────────────────────────────────
          _buildSearchBar(),
          // ── Station list ────────────────────────────────────
          Expanded(child: _buildBody()),
        ],
      ),
    );
  }

  // ── Search bar widget ──────────────────────────────────────
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
        focusNode: _searchFocusNode,
        onChanged: _onSearchChanged,
        style: AppTheme.bodyMedium,
        decoration: InputDecoration(
          hintText: '搜索站点名称或地址',
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

  // ── Body with pull-to-refresh and list ─────────────────────
  Widget _buildBody() {
    // Error state with no data
    if (_errorMessage != null && _stations.isEmpty) {
      return ErrorRetryWidget(
        message: _errorMessage!,
        onRetry: () => _loadData(isRefresh: true),
      );
    }

    // Empty state
    if (!_isLoading && _stations.isEmpty && _keyword.isNotEmpty) {
      return EmptyState(
        icon: Icons.search_off_rounded,
        title: '未找到相关站点',
        subtitle: '请尝试其他关键词',
        actionLabel: '清除搜索',
        onAction: _onSearchClear,
      );
    }

    if (!_isLoading && _stations.isEmpty) {
      return const EmptyState(
        icon: Icons.ev_station_rounded,
        title: '暂无充电站',
        subtitle: '当前没有充电站数据',
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
        controller: _scrollController,
        padding: const EdgeInsets.symmetric(
          vertical: AppTheme.spacingSm,
        ),
        itemCount: _stations.length,
        itemBuilder: (context, index) {
          return _StationCard(station: _stations[index]);
        },
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────
// Station Card
// ──────────────────────────────────────────────────────────────

class _StationCard extends StatelessWidget {
  final Station station;

  const _StationCard({required this.station});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        context.pushNamed(
          RouteNames.stationDetail,
          pathParameters: {'id': station.id},
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
              // ── Left blue bar ──────────────────────────────
              Container(
                width: 4,
                decoration: BoxDecoration(
                  color: station.isOnline
                      ? AppTheme.brandBlue
                      : AppTheme.textHint,
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
                      // ── Row 1: Name + Status tag ──────────
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              station.name,
                              style: AppTheme.titleMedium,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: AppTheme.spacingSm),
                          StatusTag.fromStatus(status: station.status),
                        ],
                      ),
                      const SizedBox(height: AppTheme.spacingSm),
                      // ── Row 2: Address ─────────────────────
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
                              station.address,
                              style: AppTheme.bodySmall,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: AppTheme.spacingMd),
                      // ── Row 3: Stats ───────────────────────
                      Row(
                        children: [
                          _buildStat(
                            icon: Icons.ev_station_rounded,
                            label: '设备',
                            value: '${station.deviceCount}',
                          ),
                          const SizedBox(width: AppTheme.spacingXl),
                          _buildStat(
                            icon: Icons.wifi_rounded,
                            label: '在线',
                            value: '${station.onlineDeviceCount}',
                            valueColor: station.onlineDeviceCount > 0
                                ? AppTheme.success
                                : AppTheme.textSecondary,
                          ),
                          if (station.distance != null) ...[
                            const Spacer(),
                            _buildDistanceTag(station.distance!),
                          ],
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

  Widget _buildStat({
    required IconData icon,
    required String label,
    required String value,
    Color? valueColor,
  }) {
    return Row(
      children: [
        Icon(icon, size: 14, color: AppTheme.textSecondary),
        const SizedBox(width: AppTheme.spacingXxs),
        Text(label, style: AppTheme.caption),
        const SizedBox(width: AppTheme.spacingXxs),
        Text(
          value,
          style: AppTheme.numberSmall.copyWith(
            color: valueColor ?? AppTheme.textPrimary,
          ),
        ),
      ],
    );
  }

  Widget _buildDistanceTag(double distance) {
    final text = distance >= 1000
        ? '${(distance / 1000).toStringAsFixed(1)}km'
        : '${distance.toStringAsFixed(0)}m';
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppTheme.spacingSm,
        vertical: AppTheme.spacingXxs,
      ),
      decoration: BoxDecoration(
        color: AppTheme.brandBlue.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(AppTheme.radiusSm),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.near_me_rounded,
            size: 12,
            color: AppTheme.brandBlue,
          ),
          const SizedBox(width: 2),
          Text(
            text,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: AppTheme.brandBlue,
            ),
          ),
        ],
      ),
    );
  }
}
