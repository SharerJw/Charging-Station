import 'dart:async';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_easyloading/flutter_easyloading.dart';
import 'package:provider/provider.dart';

import 'package:ops_flutter/core/network/api_client.dart';
import 'package:ops_flutter/core/network/api_endpoints.dart';
import 'package:ops_flutter/core/theme/app_theme.dart';

// ──────────────────────────────────────────────────────────────
// Models
// ──────────────────────────────────────────────────────────────

/// Device telemetry data returned by the backend.
class DeviceTelemetry {
  final String deviceCode;
  final String deviceName;
  final String stationName;
  final double voltage;
  final double current;
  final double power;
  final double temperature;
  final double soc;
  final String connectorStatus;
  final String deviceStatus;
  final DateTime timestamp;

  const DeviceTelemetry({
    required this.deviceCode,
    required this.deviceName,
    required this.stationName,
    required this.voltage,
    required this.current,
    required this.power,
    required this.temperature,
    required this.soc,
    required this.connectorStatus,
    required this.deviceStatus,
    required this.timestamp,
  });

  factory DeviceTelemetry.fromJson(Map<String, dynamic> json) {
    return DeviceTelemetry(
      deviceCode: json['deviceCode'] as String? ?? '',
      deviceName: json['deviceName'] as String? ?? '',
      stationName: json['stationName'] as String? ?? '',
      voltage: (json['voltage'] as num?)?.toDouble() ?? 0,
      current: (json['current'] as num?)?.toDouble() ?? 0,
      power: (json['power'] as num?)?.toDouble() ?? 0,
      temperature: (json['temperature'] as num?)?.toDouble() ?? 0,
      soc: (json['soc'] as num?)?.toDouble() ?? 0,
      connectorStatus: json['connectorStatus'] as String? ?? 'UNKNOWN',
      deviceStatus: json['deviceStatus'] as String? ?? 'OFFLINE',
      timestamp: json['timestamp'] != null
          ? DateTime.tryParse(json['timestamp'] as String) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

/// Search result item for device lookup.
class DeviceSearchItem {
  final String code;
  final String name;
  final String stationName;
  final String status;

  const DeviceSearchItem({
    required this.code,
    required this.name,
    required this.stationName,
    required this.status,
  });

  factory DeviceSearchItem.fromJson(Map<String, dynamic> json) {
    return DeviceSearchItem(
      code: json['code'] as String? ?? '',
      name: json['name'] as String? ?? '',
      stationName: json['stationName'] as String? ?? '',
      status: json['status'] as String? ?? 'OFFLINE',
    );
  }
}

/// A single control operation record.
class ControlHistoryRecord {
  final String id;
  final String deviceCode;
  final String deviceName;
  final String command;
  final int level;
  final String result;
  final String? errorMessage;
  final DateTime executedAt;

  const ControlHistoryRecord({
    required this.id,
    required this.deviceCode,
    required this.deviceName,
    required this.command,
    required this.level,
    required this.result,
    this.errorMessage,
    required this.executedAt,
  });

  factory ControlHistoryRecord.fromJson(Map<String, dynamic> json) {
    return ControlHistoryRecord(
      id: json['id'] as String? ?? '',
      deviceCode: json['deviceCode'] as String? ?? '',
      deviceName: json['deviceName'] as String? ?? '',
      command: json['command'] as String? ?? '',
      level: json['level'] as int? ?? 1,
      result: json['result'] as String? ?? '',
      errorMessage: json['errorMessage'] as String?,
      executedAt: json['executedAt'] != null
          ? DateTime.tryParse(json['executedAt'] as String) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

// ──────────────────────────────────────────────────────────────
// Control command definitions
// ──────────────────────────────────────────────────────────────

enum ControlLevel { l1, l2, l3 }

class ControlCommand {
  final String name;
  final String label;
  final String description;
  final ControlLevel level;
  final IconData icon;
  final Color color;
  final String confirmationMessage;

  const ControlCommand({
    required this.name,
    required this.label,
    required this.description,
    required this.level,
    required this.icon,
    required this.color,
    required this.confirmationMessage,
  });

  static const List<ControlCommand> allCommands = [
    // L1 - Basic (safe)
    ControlCommand(
      name: 'RESTART',
      label: '重启设备',
      description: '远程重启充电设备，约需 30-60 秒恢复',
      level: ControlLevel.l1,
      icon: Icons.restart_alt_rounded,
      color: AppTheme.brandBlue,
      confirmationMessage: '确认远程重启该设备？\n设备将在 30-60 秒后恢复在线。',
    ),
    ControlCommand(
      name: 'QUERY_STATUS',
      label: '状态查询',
      description: '获取设备当前运行状态和参数',
      level: ControlLevel.l1,
      icon: Icons.info_outline_rounded,
      color: AppTheme.brandBlue,
      confirmationMessage: '确认查询该设备状态？',
    ),

    // L2 - Charging control (medium risk)
    ControlCommand(
      name: 'START_CHARGING',
      label: '启动充电',
      description: '向设备发送启动充电指令',
      level: ControlLevel.l2,
      icon: Icons.play_circle_outline_rounded,
      color: AppTheme.success,
      confirmationMessage: '确认启动该设备的充电功能？\n请确保连接器已正确连接。',
    ),
    ControlCommand(
      name: 'STOP_CHARGING',
      label: '停止充电',
      description: '向设备发送停止充电指令',
      level: ControlLevel.l2,
      icon: Icons.stop_circle_outlined,
      color: AppTheme.warning,
      confirmationMessage: '确认停止该设备的充电？\n正在充电的会话将被中断。',
    ),

    // L3 - Critical (high risk)
    ControlCommand(
      name: 'EMERGENCY_STOP',
      label: '紧急停止',
      description: '立即切断设备输出，可能造成数据丢失',
      level: ControlLevel.l3,
      icon: Icons.emergency_rounded,
      color: AppTheme.error,
      confirmationMessage: '⚠ 紧急停止！\n\n这将立即切断设备所有输出。\n正在充电的会话将异常中断。\n\n确认执行紧急停止？',
    ),
    ControlCommand(
      name: 'FIRMWARE_UPGRADE',
      label: '固件升级',
      description: '推送最新固件至设备，升级期间设备不可用',
      level: ControlLevel.l3,
      icon: Icons.system_update_rounded,
      color: const Color(0xFF722ED1),
      confirmationMessage: '⚠ 固件升级！\n\n升级期间设备将完全不可用，预计耗时 5-15 分钟。\n\n确认推送固件升级？',
    ),
  ];
}

// ──────────────────────────────────────────────────────────────
// RemoteControlProvider
// ──────────────────────────────────────────────────────────────

class RemoteControlProvider extends ChangeNotifier {
  final ApiClient _api = ApiClient.instance;

  // ── State ─────────────────────────────────────────────────
  bool _isLoading = false;
  bool get isLoading => _isLoading;

  String? _error;
  String? get error => _error;

  List<DeviceSearchItem> _searchResults = [];
  List<DeviceSearchItem> get searchResults => _searchResults;

  DeviceTelemetry? _telemetry;
  DeviceTelemetry? get telemetry => _telemetry;

  List<ControlHistoryRecord> _history = [];
  List<ControlHistoryRecord> get history => _history;

  bool _isControlling = false;
  bool get isControlling => _isControlling;

  Timer? _refreshTimer;

  // ── Search devices ────────────────────────────────────────
  Future<void> searchDevices(String keyword) async {
    if (keyword.trim().isEmpty) {
      _searchResults = [];
      notifyListeners();
      return;
    }

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.get(
        '/api/v1/stations/devices',
        queryParameters: {'keyword': keyword.trim()},
      );
      final data = response.data;
      if (data is Map<String, dynamic> && data.containsKey('records')) {
        final records = data['list'] as List<dynamic>? ?? [];
        _searchResults =
            records.map((e) => DeviceSearchItem.fromJson(e as Map<String, dynamic>)).toList();
      } else if (data is List) {
        _searchResults =
            data.map((e) => DeviceSearchItem.fromJson(e as Map<String, dynamic>)).toList();
      } else {
        _searchResults = [];
      }
    } catch (e) {
      _error = '搜索失败: $e';
      _searchResults = [];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // ── Fetch telemetry ───────────────────────────────────────
  Future<void> fetchTelemetry(String deviceCode) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final path = ApiEndpoints.deviceTelemetry(deviceCode);
      final response = await _api.get(path);
      _telemetry = DeviceTelemetry.fromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      _error = '获取遥测数据失败: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Start auto-refreshing telemetry every 5 seconds.
  void startAutoRefresh(String deviceCode) {
    _refreshTimer?.cancel();
    fetchTelemetry(deviceCode);
    _refreshTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      fetchTelemetry(deviceCode);
    });
  }

  void stopAutoRefresh() {
    _refreshTimer?.cancel();
  }

  // ── Send control command ──────────────────────────────────
  Future<bool> sendCommand({
    required String deviceCode,
    required String command,
  }) async {
    _isControlling = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.post(
        '/api/v1/charging/control',
        data: {
          'deviceCode': deviceCode,
          'command': command,
        },
      );

      final result = response.data as Map<String, dynamic>?;
      final success = result?['success'] as bool? ?? true;

      if (success) {
        EasyLoading.showSuccess('指令已发送');
        // Refresh telemetry after command
        await fetchTelemetry(deviceCode);
        await fetchHistory(deviceCode);
      } else {
        final msg = result?['message'] as String? ?? '指令执行失败';
        _error = msg;
        EasyLoading.showError(msg);
      }

      _isControlling = false;
      notifyListeners();
      return success;
    } catch (e) {
      _error = '发送指令失败: $e';
      EasyLoading.showError('发送指令失败');
      _isControlling = false;
      notifyListeners();
      return false;
    }
  }

  // ── Fetch operation history ───────────────────────────────
  Future<void> fetchHistory(String deviceCode) async {
    try {
      final response = await _api.get(
        '/api/v1/charging/control/history',
        queryParameters: {'deviceCode': deviceCode},
      );
      final data = response.data;
      if (data is List) {
        _history =
            data.map((e) => ControlHistoryRecord.fromJson(e as Map<String, dynamic>)).toList();
      } else if (data is Map<String, dynamic> && data.containsKey('records')) {
        final records = data['list'] as List<dynamic>? ?? [];
        _history = records
            .map((e) => ControlHistoryRecord.fromJson(e as Map<String, dynamic>))
            .toList();
      } else {
        _history = [];
      }
    } catch (_) {
      // Silent fail for history
    }
    notifyListeners();
  }

  // ── Clear selection ───────────────────────────────────────
  void clearDevice() {
    stopAutoRefresh();
    _telemetry = null;
    _searchResults = [];
    _history = [];
    _error = null;
    notifyListeners();
  }

  @override
  void dispose() {
    stopAutoRefresh();
    super.dispose();
  }
}

// ──────────────────────────────────────────────────────────────
// Gauge Painter (circular / semicircular)
// ──────────────────────────────────────────────────────────────

class _GaugePainter extends CustomPainter {
  final double value;
  final double maxValue;
  final Color color;
  final bool isSemicircle;

  _GaugePainter({
    required this.value,
    required this.maxValue,
    required this.color,
    this.isSemicircle = false,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = min(size.width, size.height) / 2 - 8;

    // Background arc
    final bgPaint = Paint()
      ..color = color.withOpacity(0.1)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 8
      ..strokeCap = StrokeCap.round;

    final sweepAngle = isSemicircle ? pi : 2 * pi;
    final startAngle = isSemicircle ? pi / 2 : -pi / 2;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      startAngle,
      sweepAngle,
      false,
      bgPaint,
    );

    // Value arc
    final fraction = maxValue > 0 ? (value / maxValue).clamp(0.0, 1.0) : 0.0;
    final valuePaint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 8
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      startAngle,
      sweepAngle * fraction,
      false,
      valuePaint,
    );

    // Glow effect on the arc tip
    if (fraction > 0) {
      final glowPaint = Paint()
        ..color = color.withOpacity(0.3)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 16
        ..strokeCap = StrokeCap.round
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 4);

      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        startAngle,
        sweepAngle * fraction,
        false,
        glowPaint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _GaugePainter oldDelegate) {
    return oldDelegate.value != value ||
        oldDelegate.maxValue != maxValue ||
        oldDelegate.color != color;
  }
}

// ──────────────────────────────────────────────────────────────
// Gauge Widget
// ──────────────────────────────────────────────────────────────

class _GaugeWidget extends StatelessWidget {
  final String label;
  final double value;
  final double maxValue;
  final String unit;
  final Color color;
  final bool isSemicircle;

  const _GaugeWidget({
    required this.label,
    required this.value,
    required this.maxValue,
    required this.unit,
    required this.color,
    this.isSemicircle = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          label,
          style: AppTheme.bodySmall.copyWith(
            color: AppTheme.textSecondary,
            fontSize: 11,
          ),
        ),
        const SizedBox(height: 4),
        SizedBox(
          width: 100,
          height: isSemicircle ? 64 : 100,
          child: Stack(
            alignment: Alignment.center,
            children: [
              CustomPaint(
                size: Size(
                  100,
                  isSemicircle ? 64 : 100,
                ),
                painter: _GaugePainter(
                  value: value,
                  maxValue: maxValue,
                  color: color,
                  isSemicircle: isSemicircle,
                ),
              ),
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    value.toStringAsFixed(1),
                    style: AppTheme.numberSmall.copyWith(
                      color: color,
                      fontSize: 16,
                    ),
                  ),
                  Text(
                    unit,
                    style: TextStyle(
                      fontSize: 10,
                      color: color.withOpacity(0.7),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ──────────────────────────────────────────────────────────────
// RemoteControlPage (main page)
// ──────────────────────────────────────────────────────────────

class RemoteControlPage extends StatefulWidget {
  const RemoteControlPage({super.key});

  @override
  State<RemoteControlPage> createState() => _RemoteControlPageState();
}

class _RemoteControlPageState extends State<RemoteControlPage>
    with SingleTickerProviderStateMixin {
  final _searchController = TextEditingController();
  final _searchFocusNode = FocusNode();
  late TabController _tabController;
  bool _showSearchResults = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _searchFocusNode.dispose();
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => RemoteControlProvider(),
      child: Scaffold(
        backgroundColor: const Color(0xFF0B1120),
        appBar: _buildAppBar(),
        body: Consumer<RemoteControlProvider>(
          builder: (context, provider, _) {
            if (provider.telemetry != null) {
              return _buildDashboard(provider);
            }
            return _buildSearchView(provider);
          },
        ),
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    final provider = context.read<RemoteControlProvider>();
    final hasDevice = provider.telemetry != null;

    return AppBar(
      backgroundColor: const Color(0xFF111827),
      leading: hasDevice
          ? IconButton(
              icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 20),
              onPressed: () {
                provider.clearDevice();
                _searchController.clear();
                setState(() => _showSearchResults = false);
              },
            )
          : null,
      title: Text(
        hasDevice ? provider.telemetry!.deviceName : '远程控制',
        style: const TextStyle(
          color: Colors.white,
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
      ),
      centerTitle: true,
      actions: [
        if (hasDevice)
          IconButton(
            icon: const Icon(Icons.history_rounded, color: Colors.white70, size: 22),
            onPressed: () => _showHistorySheet(provider),
          ),
      ],
      bottom: hasDevice
          ? TabBar(
              controller: _tabController,
              indicatorColor: const Color(0xFF3B82F6),
              indicatorWeight: 3,
              labelColor: Colors.white,
              unselectedLabelColor: Colors.white54,
              labelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
              tabs: const [
                Tab(text: '参数监控'),
                Tab(text: '控制面板'),
                Tab(text: '连接器'),
              ],
            )
          : null,
    );
  }

  // ── Search View ─────────────────────────────────────────────

  Widget _buildSearchView(RemoteControlProvider provider) {
    return GestureDetector(
      onTap: () => _searchFocusNode.unfocus(),
      behavior: HitTestBehavior.translucent,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Search bar
            Container(
              decoration: BoxDecoration(
                color: const Color(0xFF1F2937),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF374151)),
              ),
              child: TextField(
                controller: _searchController,
                focusNode: _searchFocusNode,
                style: const TextStyle(color: Colors.white, fontSize: 15),
                decoration: InputDecoration(
                  hintText: '输入设备编码或名称搜索',
                  hintStyle: TextStyle(color: Colors.white.withOpacity(0.35)),
                  prefixIcon: const Icon(Icons.search_rounded, color: Colors.white54),
                  suffixIcon: _searchController.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.close_rounded, color: Colors.white54, size: 20),
                          onPressed: () {
                            _searchController.clear();
                            provider.searchDevices('');
                            setState(() => _showSearchResults = false);
                          },
                        )
                      : null,
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                ),
                onChanged: (value) {
                  setState(() {});
                  if (value.trim().length >= 2) {
                    provider.searchDevices(value);
                    setState(() => _showSearchResults = true);
                  } else {
                    setState(() => _showSearchResults = false);
                  }
                },
                onSubmitted: (value) {
                  if (value.trim().isNotEmpty) {
                    provider.searchDevices(value);
                    setState(() => _showSearchResults = true);
                  }
                },
              ),
            ),

            const SizedBox(height: 16),

            // Search results or placeholder
            if (_showSearchResults) ...[
              if (provider.isLoading && provider.searchResults.isEmpty)
                const Expanded(
                  child: Center(
                    child: CircularProgressIndicator(color: Color(0xFF3B82F6)),
                  ),
                )
              else if (provider.searchResults.isEmpty)
                Expanded(
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.search_off_rounded,
                            size: 56, color: Colors.white.withOpacity(0.2)),
                        const SizedBox(height: 12),
                        Text(
                          '未找到匹配设备',
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.4),
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              else
                Expanded(
                  child: ListView.separated(
                    itemCount: provider.searchResults.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final item = provider.searchResults[index];
                      return _buildSearchResultCard(provider, item);
                    },
                  ),
                ),
            ] else
              Expanded(
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.router_rounded,
                        size: 72,
                        color: Colors.white.withOpacity(0.1),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        '搜索设备进行远程控制',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.3),
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '支持设备编码、设备名称搜索',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.2),
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchResultCard(RemoteControlProvider provider, DeviceSearchItem item) {
    final statusColor = AppTheme.statusColor(item.status);

    return GestureDetector(
      onTap: () {
        _searchFocusNode.unfocus();
        provider.fetchTelemetry(item.code);
        provider.fetchHistory(item.code);
        provider.startAutoRefresh(item.code);
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF1F2937),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFF374151)),
        ),
        child: Row(
          children: [
            // Device icon
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: const Color(0xFF3B82F6).withOpacity(0.15),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.ev_station_rounded,
                color: Color(0xFF3B82F6),
                size: 24,
              ),
            ),
            const SizedBox(width: 14),
            // Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.name,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    item.code,
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.45),
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    item.stationName,
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.35),
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
            // Status chip
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: statusColor.withOpacity(0.15),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                item.status,
                style: TextStyle(
                  color: statusColor,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Icon(
              Icons.chevron_right_rounded,
              color: Colors.white.withOpacity(0.3),
              size: 20,
            ),
          ],
        ),
      ),
    );
  }

  // ── Dashboard (device selected) ─────────────────────────────

  Widget _buildDashboard(RemoteControlProvider provider) {
    final t = provider.telemetry!;

    return Column(
      children: [
        // Device status header
        _buildDeviceHeader(t),

        // Tab content
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              _buildTelemetryTab(t),
              _buildControlTab(provider, t),
              _buildConnectorTab(t),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildDeviceHeader(DeviceTelemetry t) {
    final statusColor = AppTheme.statusColor(t.deviceStatus);
    final ts =
        '${t.timestamp.year}-${t.timestamp.month.toString().padLeft(2, '0')}-${t.timestamp.day.toString().padLeft(2, '0')} '
        '${t.timestamp.hour.toString().padLeft(2, '0')}:${t.timestamp.minute.toString().padLeft(2, '0')}:${t.timestamp.second.toString().padLeft(2, '0')}';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      decoration: const BoxDecoration(
        color: Color(0xFF111827),
        border: Border(bottom: BorderSide(color: Color(0xFF1F2937))),
      ),
      child: Row(
        children: [
          // Status dot
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: statusColor,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: statusColor.withOpacity(0.5),
                  blurRadius: 6,
                  spreadRadius: 1,
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Text(
            t.deviceCode,
            style: TextStyle(
              color: Colors.white.withOpacity(0.6),
              fontSize: 13,
              fontFamily: 'DIN Alternate',
            ),
          ),
          const SizedBox(width: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.15),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              t.deviceStatus,
              style: TextStyle(color: statusColor, fontSize: 11, fontWeight: FontWeight.w600),
            ),
          ),
          const Spacer(),
          Text(
            ts,
            style: TextStyle(
              color: Colors.white.withOpacity(0.3),
              fontSize: 11,
            ),
          ),
          const SizedBox(width: 4),
          // Refresh indicator
          SizedBox(
            width: 14,
            height: 14,
            child: CircularProgressIndicator(
              strokeWidth: 1.5,
              color: Colors.white.withOpacity(0.2),
            ),
          ),
        ],
      ),
    );
  }

  // ── Telemetry Tab (gauges) ──────────────────────────────────

  Widget _buildTelemetryTab(DeviceTelemetry t) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Top row: Voltage, Current, Power
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _GaugeWidget(
                label: '电压',
                value: t.voltage,
                maxValue: 800,
                unit: 'V',
                color: const Color(0xFF3B82F6),
              ),
              _GaugeWidget(
                label: '电流',
                value: t.current,
                maxValue: 250,
                unit: 'A',
                color: const Color(0xFF10B981),
              ),
              _GaugeWidget(
                label: '功率',
                value: t.power,
                maxValue: 240,
                unit: 'kW',
                color: const Color(0xFFF59E0B),
              ),
            ],
          ),

          const SizedBox(height: 24),

          // Middle row: Temperature (semicircle), SOC (semicircle)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _GaugeWidget(
                label: '温度',
                value: t.temperature,
                maxValue: 80,
                unit: '°C',
                color: t.temperature > 60
                    ? AppTheme.error
                    : t.temperature > 40
                        ? AppTheme.warning
                        : const Color(0xFF06B6D4),
                isSemicircle: true,
              ),
              _GaugeWidget(
                label: 'SOC',
                value: t.soc,
                maxValue: 100,
                unit: '%',
                color: t.soc > 80
                    ? const Color(0xFF10B981)
                    : t.soc > 20
                        ? const Color(0xFF3B82F6)
                        : AppTheme.warning,
                isSemicircle: true,
              ),
            ],
          ),

          const SizedBox(height: 24),

          // Detail info cards
          _buildInfoCard('连接器状态', t.connectorStatus),
          const SizedBox(height: 8),
          _buildInfoCard('设备状态', t.deviceStatus),
        ],
      ),
    );
  }

  Widget _buildInfoCard(String label, String value) {
    final color = AppTheme.statusColor(value);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF1F2937),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 13),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: color.withOpacity(0.15),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              value,
              style: TextStyle(
                color: color,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Control Tab ─────────────────────────────────────────────

  Widget _buildControlTab(RemoteControlProvider provider, DeviceTelemetry t) {
    final l1 = ControlCommand.allCommands.where((c) => c.level == ControlLevel.l1).toList();
    final l2 = ControlCommand.allCommands.where((c) => c.level == ControlLevel.l2).toList();
    final l3 = ControlCommand.allCommands.where((c) => c.level == ControlLevel.l3).toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildLevelSection('L1 - 基础操作', l1, provider, t.deviceCode),
          const SizedBox(height: 20),
          _buildLevelSection('L2 - 充电控制', l2, provider, t.deviceCode),
          const SizedBox(height: 20),
          _buildLevelSection('L3 - 高级控制', l3, provider, t.deviceCode),
        ],
      ),
    );
  }

  Widget _buildLevelSection(
    String title,
    List<ControlCommand> commands,
    RemoteControlProvider provider,
    String deviceCode,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: TextStyle(
            color: Colors.white.withOpacity(0.5),
            fontSize: 12,
            fontWeight: FontWeight.w600,
            letterSpacing: 1,
          ),
        ),
        const SizedBox(height: 10),
        ...commands.map((cmd) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _buildControlButton(provider, cmd, deviceCode),
            )),
      ],
    );
  }

  Widget _buildControlButton(
    RemoteControlProvider provider,
    ControlCommand cmd,
    String deviceCode,
  ) {
    final isL3 = cmd.level == ControlLevel.l3;

    return GestureDetector(
      onTap: provider.isControlling
          ? null
          : () => _confirmAndExecute(provider, cmd, deviceCode),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xFF1F2937),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isL3
                ? cmd.color.withOpacity(0.4)
                : const Color(0xFF374151),
          ),
        ),
        child: Row(
          children: [
            // Icon
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: cmd.color.withOpacity(0.15),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(cmd.icon, color: cmd.color, size: 22),
            ),
            const SizedBox(width: 14),
            // Label + description
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        cmd.label,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      if (isL3) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                          decoration: BoxDecoration(
                            color: AppTheme.error.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text(
                            '高危',
                            style: TextStyle(
                              color: AppTheme.error,
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 3),
                  Text(
                    cmd.description,
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.35),
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.chevron_right_rounded,
              color: Colors.white.withOpacity(0.2),
              size: 20,
            ),
          ],
        ),
      ),
    );
  }

  // ── Connector Tab ───────────────────────────────────────────

  Widget _buildConnectorTab(DeviceTelemetry t) {
    final statusColor = AppTheme.statusColor(t.connectorStatus);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Connector status card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: const Color(0xFF1F2937),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: statusColor.withOpacity(0.3)),
            ),
            child: Column(
              children: [
                // Connector icon
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    shape: BoxShape.circle,
                    border: Border.all(color: statusColor.withOpacity(0.3), width: 2),
                  ),
                  child: Icon(
                    Icons.electrical_services_rounded,
                    color: statusColor,
                    size: 40,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  t.connectorStatus,
                  style: TextStyle(
                    color: statusColor,
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _connectorStatusDescription(t.connectorStatus),
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.4),
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // Connector parameters
          _buildConnectorParamRow('额定电压', '750V DC'),
          _buildConnectorParamRow('额定电流', '250A'),
          _buildConnectorParamRow('最大功率', '180kW'),
          _buildConnectorParamRow('枪头类型', 'CCS2 / GB/T'),
          _buildConnectorParamRow('通信协议', 'OCPP 1.6J'),
          const SizedBox(height: 20),

          // Status timeline
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF1F2937),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '连接器事件',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.5),
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 12),
                _buildTimelineEvent(
                  '连接器插入',
                  '${t.timestamp.hour.toString().padLeft(2, '0')}:${t.timestamp.minute.toString().padLeft(2, '0')}',
                  AppTheme.success,
                ),
                _buildTimelineEvent(
                  '开始充电',
                  '${t.timestamp.hour.toString().padLeft(2, '0')}:${(t.timestamp.minute - 2).toString().padLeft(2, '0')}',
                  const Color(0xFF3B82F6),
                ),
                _buildTimelineEvent(
                  '设备上线',
                  '${t.timestamp.hour.toString().padLeft(2, '0')}:${(t.timestamp.minute - 10).toString().padLeft(2, '0')}',
                  Colors.white38,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildConnectorParamRow(String label, String value) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF1F2937),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(color: Colors.white.withOpacity(0.45), fontSize: 13),
          ),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTimelineEvent(String title, String time, Color dotColor) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Column(
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: dotColor,
                  shape: BoxShape.circle,
                ),
              ),
              Container(width: 1, height: 16, color: Colors.white12),
            ],
          ),
          const SizedBox(width: 12),
          Text(
            title,
            style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 13),
          ),
          const Spacer(),
          Text(
            time,
            style: TextStyle(
              color: Colors.white.withOpacity(0.3),
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  String _connectorStatusDescription(String status) {
    switch (status.toUpperCase()) {
      case 'AVAILABLE':
        return '空闲可用';
      case 'CHARGING':
        return '正在充电中';
      case 'UNAVAILABLE':
        return '不可用';
      case 'FAULTED':
        return '故障状态';
      case 'RESERVED':
        return '已预约';
      default:
        return '未知状态';
    }
  }

  // ── Confirmation dialog ─────────────────────────────────────

  Future<void> _confirmAndExecute(
    RemoteControlProvider provider,
    ControlCommand cmd,
    String deviceCode,
  ) async {
    final isL3 = cmd.level == ControlLevel.l3;
    final confirmed = await showDialog<bool>(
      context: context,
      barrierDismissible: true,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1F2937),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(
            color: isL3 ? AppTheme.error.withOpacity(0.5) : const Color(0xFF374151),
          ),
        ),
        title: Row(
          children: [
            Icon(cmd.icon, color: cmd.color, size: 24),
            const SizedBox(width: 10),
            Text(
              cmd.label,
              style: const TextStyle(color: Colors.white, fontSize: 18),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (isL3)
              Container(
                padding: const EdgeInsets.all(10),
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(
                  color: AppTheme.error.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppTheme.error.withOpacity(0.3)),
                ),
                child: Row(
                  children: const [
                    Icon(Icons.warning_amber_rounded, color: AppTheme.error, size: 18),
                    SizedBox(width: 8),
                    Text(
                      '此操作需要最高权限',
                      style: TextStyle(color: AppTheme.error, fontSize: 12),
                    ),
                  ],
                ),
              ),
            Text(
              cmd.confirmationMessage,
              style: TextStyle(
                color: Colors.white.withOpacity(0.7),
                fontSize: 14,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              '设备编码: $deviceCode',
              style: TextStyle(
                color: Colors.white.withOpacity(0.35),
                fontSize: 12,
                fontFamily: 'DIN Alternate',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: Text(
              '取消',
              style: TextStyle(
                color: Colors.white.withOpacity(0.5),
                fontSize: 15,
              ),
            ),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: ElevatedButton.styleFrom(
              backgroundColor: isL3 ? AppTheme.error : cmd.color,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: Text(isL3 ? '确认执行' : '确定'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await provider.sendCommand(deviceCode: deviceCode, command: cmd.name);
    }
  }

  // ── History bottom sheet ────────────────────────────────────

  void _showHistorySheet(RemoteControlProvider provider) {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF111827),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      isScrollControlled: true,
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        minChildSize: 0.3,
        maxChildSize: 0.9,
        expand: false,
        builder: (ctx, scrollController) => Column(
          children: [
            // Handle bar
            Container(
              margin: const EdgeInsets.only(top: 10),
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white24,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              '操作历史',
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: provider.history.isEmpty
                  ? Center(
                      child: Text(
                        '暂无操作记录',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.3),
                          fontSize: 14,
                        ),
                      ),
                    )
                  : ListView.separated(
                      controller: scrollController,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      itemCount: provider.history.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (context, index) {
                        final record = provider.history[index];
                        return _buildHistoryItem(record);
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHistoryItem(ControlHistoryRecord record) {
    final isSuccess = record.result.toUpperCase() == 'SUCCESS';
    final resultColor = isSuccess ? AppTheme.success : AppTheme.error;
    final levelLabel = record.level == 1
        ? 'L1'
        : record.level == 2
            ? 'L2'
            : 'L3';
    final levelColor = record.level == 1
        ? AppTheme.brandBlue
        : record.level == 2
            ? AppTheme.warning
            : AppTheme.error;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF1F2937),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              // Level badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: levelColor.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  levelLabel,
                  style: TextStyle(
                    color: levelColor,
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                record.command,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const Spacer(),
              // Result badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: resultColor.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  record.result,
                  style: TextStyle(
                    color: resultColor,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          if (record.errorMessage != null) ...[
            const SizedBox(height: 6),
            Text(
              record.errorMessage!,
              style: TextStyle(
                color: AppTheme.error.withOpacity(0.7),
                fontSize: 11,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
          const SizedBox(height: 6),
          Text(
            '${record.executedAt.year}-${record.executedAt.month.toString().padLeft(2, '0')}-${record.executedAt.day.toString().padLeft(2, '0')} '
            '${record.executedAt.hour.toString().padLeft(2, '0')}:${record.executedAt.minute.toString().padLeft(2, '0')}:${record.executedAt.second.toString().padLeft(2, '0')}',
            style: TextStyle(
              color: Colors.white.withOpacity(0.25),
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }
}
