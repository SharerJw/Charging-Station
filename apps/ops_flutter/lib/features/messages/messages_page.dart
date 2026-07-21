import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:pull_to_refresh/pull_to_refresh.dart';

import 'package:ops_flutter/core/network/api_client.dart';
import 'package:ops_flutter/core/network/api_endpoints.dart';
import 'package:ops_flutter/core/router/app_router.dart';
import 'package:ops_flutter/core/theme/app_theme.dart';
import 'package:ops_flutter/shared/widgets/common_widgets.dart';

// ──────────────────────────────────────────────────────────────
// Models
// ──────────────────────────────────────────────────────────────

/// Message data model.
class MessageItem {
  final String id;
  final String title;
  final String summary;
  final String type; // WORKORDER / ALERT / SYSTEM
  final bool read;
  final String? relatedId; // ID of the related entity (work order, alert, etc.)
  final String? relatedType;
  final DateTime createdAt;

  const MessageItem({
    required this.id,
    required this.title,
    required this.summary,
    required this.type,
    required this.read,
    this.relatedId,
    this.relatedType,
    required this.createdAt,
  });

  factory MessageItem.fromJson(Map<String, dynamic> json) {
    return MessageItem(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      summary: json['summary']?.toString() ?? '',
      type: json['type']?.toString() ?? 'SYSTEM',
      read: json['read'] as bool? ?? false,
      relatedId: json['relatedId']?.toString(),
      relatedType: json['relatedType']?.toString(),
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
    );
  }
}

/// Unread count per message type.
class UnreadCounts {
  final int workorder;
  final int alert;
  final int system;

  const UnreadCounts({
    this.workorder = 0,
    this.alert = 0,
    this.system = 0,
  });

  int get total => workorder + alert + system;

  factory UnreadCounts.fromJson(Map<String, dynamic> json) {
    return UnreadCounts(
      workorder: json['workorder'] as int? ?? 0,
      alert: json['alert'] as int? ?? 0,
      system: json['system'] as int? ?? 0,
    );
  }
}

// ──────────────────────────────────────────────────────────────
// Messages Page
// ──────────────────────────────────────────────────────────────

/// Messages center page with tab filtering by message type.
class MessagesPage extends StatefulWidget {
  const MessagesPage({super.key});

  @override
  State<MessagesPage> createState() => _MessagesPageState();
}

class _MessagesPageState extends State<MessagesPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  static const _tabs = ['工单消息', '告警消息', '系统消息'];
  static const _tabTypes = ['workorder', 'alert', 'system'];

  UnreadCounts _unreadCounts = const UnreadCounts();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
    _loadUnreadCounts();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadUnreadCounts() async {
    try {
      final response = await ApiClient.instance.get(
        ApiEndpoints.messageUnreadCount,
      );
      final data = response.data;
      if (data is Map<String, dynamic>) {
        final counts = UnreadCounts.fromJson(data);
        setState(() {
          _unreadCounts = counts;
        });
      }
    } catch (_) {
      // Silently ignore - unread count is non-critical
    }
  }

  Future<void> _markAllRead() async {
    final currentType = _tabTypes[_tabController.index];
    try {
      await ApiClient.instance.post(
        ApiEndpoints.messageReadAll(type: currentType),
      );
      _loadUnreadCounts();
      // Notify the active tab to refresh
      // The tab pages use GlobalKey, so we trigger a refresh via callback
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('已全部标记为已读'),
            backgroundColor: AppTheme.success,
          ),
        );
      }
    } on DioException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message ?? '操作失败')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        title: const Text('消息中心'),
        actions: [
          TextButton(
            onPressed: _markAllRead,
            child: const Text(
              '全部已读',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
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
              tabs: List.generate(_tabs.length, (index) {
                final count = _tabTypeUnreadCount(_tabTypes[index]);
                return Tab(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(_tabs[index]),
                      if (count > 0) ...[
                        const SizedBox(width: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 5,
                            vertical: 1,
                          ),
                          decoration: BoxDecoration(
                            color: AppTheme.error,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          constraints: const BoxConstraints(
                            minWidth: 16,
                            minHeight: 16,
                          ),
                          child: Text(
                            count > 99 ? '99+' : '$count',
                            style: const TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.w600,
                              color: Colors.white,
                              height: 1.2,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ],
                    ],
                  ),
                );
              }),
            ),
          ),
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: _tabTypes.map((type) {
          return _MessageListTab(
            messageType: type,
            onUnreadChanged: _loadUnreadCounts,
          );
        }).toList(),
      ),
    );
  }

  int _tabTypeUnreadCount(String type) {
    switch (type) {
      case 'workorder':
        return _unreadCounts.workorder;
      case 'alert':
        return _unreadCounts.alert;
      case 'system':
        return _unreadCounts.system;
      default:
        return 0;
    }
  }
}

// ──────────────────────────────────────────────────────────────
// Message List Tab (reusable for each type)
// ──────────────────────────────────────────────────────────────

class _MessageListTab extends StatefulWidget {
  final String messageType;
  final VoidCallback? onUnreadChanged;

  const _MessageListTab({
    required this.messageType,
    this.onUnreadChanged,
  });

  @override
  State<_MessageListTab> createState() => _MessageListTabState();
}

class _MessageListTabState extends State<_MessageListTab>
    with AutomaticKeepAliveClientMixin {
  final List<MessageItem> _messages = [];
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
  bool get wantKeepAlive => true;

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
        ApiEndpoints.messages,
        queryParameters: {
          'page': _currentPage,
          'size': _pageSize,
          'type': widget.messageType,
        },
      );

      final data = response.data as Map<String, dynamic>?;
      if (data != null) {
        final records = (data['list'] as List<dynamic>?)
                ?.map((e) => MessageItem.fromJson(e as Map<String, dynamic>))
                .toList() ??
            [];
        final total = data['total'] as int? ?? 0;

        setState(() {
          if (isRefresh) {
            _messages.clear();
          }
          _messages.addAll(records);
          _total = total;
          _currentPage++;
          _hasMore = _messages.length < _total;
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

  Future<void> _markAsRead(MessageItem message) async {
    if (message.read) return;

    try {
      await ApiClient.instance.post(
        ApiEndpoints.messageRead(message.id),
      );

      setState(() {
        final idx = _messages.indexWhere((m) => m.id == message.id);
        if (idx >= 0) {
          _messages[idx] = MessageItem(
            id: message.id,
            title: message.title,
            summary: message.summary,
            type: message.type,
            read: true,
            relatedId: message.relatedId,
            relatedType: message.relatedType,
            createdAt: message.createdAt,
          );
        }
      });

      widget.onUnreadChanged?.call();
    } on DioException catch (_) {
      // Silently ignore read-mark failures
    }
  }

  void _navigateToRelated(MessageItem message) {
    if (message.relatedId == null || message.relatedType == null) return;

    switch (message.relatedType!.toUpperCase()) {
      case 'WORK_ORDER':
        context.pushNamed(
          RouteNames.workOrderDetail,
          pathParameters: {'id': message.relatedId!},
        );
        break;
      case 'ALERT':
        context.pushNamed(
          RouteNames.alertDetail,
          pathParameters: {'id': message.relatedId!},
        );
        break;
      default:
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);

    if (_errorMessage != null && _messages.isEmpty) {
      return ErrorRetryWidget(
        message: _errorMessage!,
        onRetry: () => _loadData(isRefresh: true),
      );
    }

    if (!_isLoading && _messages.isEmpty) {
      return EmptyState(
        icon: _emptyIcon(),
        title: '暂无${_typeLabel()}消息',
        subtitle: '相关消息将在此显示',
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
        itemCount: _messages.length,
        itemBuilder: (context, index) => _buildMessageCard(_messages[index]),
      ),
    );
  }

  Widget _buildMessageCard(MessageItem message) {
    final iconData = _messageIcon(message.type);
    final iconColor = _messageIconColor(message.type);
    final timeStr = _formatTime(message.createdAt);

    return GestureDetector(
      onTap: () {
        _markAsRead(message);
        _navigateToRelated(message);
      },
      child: Container(
        margin: const EdgeInsets.symmetric(
          horizontal: AppTheme.spacingLg,
          vertical: AppTheme.spacingXs,
        ),
        decoration: BoxDecoration(
          color: message.read
              ? AppTheme.backgroundWhite
              : AppTheme.brandBlue.withOpacity(0.02),
          borderRadius: BorderRadius.circular(AppTheme.radiusLg),
          border: Border.all(
            color: message.read ? AppTheme.border : AppTheme.brandBlue.withOpacity(0.15),
            width: 0.5,
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(AppTheme.spacingLg),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Icon ──────────────────────────────
              Stack(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: iconColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                    ),
                    child: Icon(iconData, color: iconColor, size: 22),
                  ),
                  // Unread dot
                  if (!message.read)
                    Positioned(
                      right: 0,
                      top: 0,
                      child: Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: AppTheme.error,
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(width: AppTheme.spacingMd),
              // ── Content ───────────────────────────
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title row
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            message.title,
                            style: AppTheme.bodyMedium.copyWith(
                              fontWeight: message.read
                                  ? FontWeight.w400
                                  : FontWeight.w600,
                              color: message.read
                                  ? AppTheme.textPrimary
                                  : AppTheme.textPrimary,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: AppTheme.spacingSm),
                        Text(timeStr, style: AppTheme.caption),
                      ],
                    ),
                    const SizedBox(height: AppTheme.spacingXs),
                    // Summary
                    Text(
                      message.summary,
                      style: AppTheme.bodySmall.copyWith(
                        color: message.read
                            ? AppTheme.textSecondary
                            : AppTheme.textPrimary.withOpacity(0.7),
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  IconData _messageIcon(String type) {
    switch (type.toUpperCase()) {
      case 'WORKORDER':
        return Icons.assignment_rounded;
      case 'ALERT':
        return Icons.warning_amber_rounded;
      case 'SYSTEM':
        return Icons.info_outline_rounded;
      default:
        return Icons.notifications_rounded;
    }
  }

  Color _messageIconColor(String type) {
    switch (type.toUpperCase()) {
      case 'WORKORDER':
        return AppTheme.brandBlue;
      case 'ALERT':
        return AppTheme.error;
      case 'SYSTEM':
        return AppTheme.info;
      default:
        return AppTheme.textSecondary;
    }
  }

  IconData _emptyIcon() {
    switch (widget.messageType) {
      case 'workorder':
        return Icons.assignment_rounded;
      case 'alert':
        return Icons.warning_amber_rounded;
      case 'system':
        return Icons.info_outline_rounded;
      default:
        return Icons.notifications_rounded;
    }
  }

  String _typeLabel() {
    switch (widget.messageType) {
      case 'workorder':
        return '工单';
      case 'alert':
        return '告警';
      case 'system':
        return '系统';
      default:
        return '';
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
