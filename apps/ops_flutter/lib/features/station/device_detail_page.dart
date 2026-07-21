import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'package:ops_flutter/core/network/api_client.dart';
import 'package:ops_flutter/core/network/api_endpoints.dart';
import 'package:ops_flutter/core/theme/app_theme.dart';
import 'package:ops_flutter/shared/widgets/common_widgets.dart';

class DeviceDetailPage extends StatefulWidget {
  final String deviceId;

  const DeviceDetailPage({super.key, required this.deviceId});

  @override
  State<DeviceDetailPage> createState() => _DeviceDetailPageState();
}

class _DeviceDetailPageState extends State<DeviceDetailPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  Map<String, dynamic>? _device;
  List<Map<String, dynamic>> _faults = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadDevice();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadDevice() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final results = await Future.wait([
        ApiClient.instance.get(
          ApiEndpoints.deviceDetail.replaceAll('{id}', widget.deviceId),
        ),
        ApiClient.instance.get(
          ApiEndpoints.deviceStatus.replaceAll('{id}', widget.deviceId),
        ),
        ApiClient.instance.get(
          ApiEndpoints.deviceFaults.replaceAll('{id}', widget.deviceId),
        ).catchError((_) => Response(data: [], requestOptions: RequestOptions())),
      ]);

      final deviceData = results[0].data as Map<String, dynamic>?;
      final statusData = results[1].data as Map<String, dynamic>?;
      final faultData = results[2].data;

      if (mounted) {
        setState(() {
          _device = {...?deviceData, ...?statusData};
          _faults = faultData is List
              ? (faultData).map((e) => e as Map<String, dynamic>).toList()
              : [];
          _isLoading = false;
        });
      }
    } on DioException catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.message ?? '加载失败';
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = '加载设备详情失败';
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        title: Text(_device?['name']?.toString() ?? '设备详情'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 20),
          onPressed: () => context.pop(),
        ),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppTheme.brandBlue,
          unselectedLabelColor: AppTheme.textSecondary,
          indicatorColor: AppTheme.brandBlue,
          tabs: const [
            Tab(text: '基本信息'),
            Tab(text: '运行参数'),
            Tab(text: '故障记录'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.brandBlue))
          : _errorMessage != null
              ? ErrorRetryWidget(message: _errorMessage!, onRetry: _loadDevice)
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _buildInfoTab(),
                    _buildTelemetryTab(),
                    _buildFaultsTab(),
                  ],
                ),
    );
  }

  Widget _buildInfoTab() {
    final d = _device ?? {};
    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppTheme.spacingLg),
      child: Column(
        children: [
          _buildInfoCard('设备编码', d['code']?.toString() ?? '-'),
          _buildInfoCard('设备名称', d['name']?.toString() ?? '-'),
          _buildInfoCard('所属站点', d['stationName']?.toString() ?? '-'),
          _buildInfoCard('设备类型', d['type']?.toString() ?? '-'),
          _buildInfoCard('设备型号', d['model']?.toString() ?? '-'),
          _buildInfoCard('状态', d['status']?.toString() ?? '-'),
          _buildInfoCard('在线状态', d['online'] == true ? '在线' : '离线'),
          _buildInfoCard('安装日期', d['installDate']?.toString() ?? '-'),
          _buildInfoCard('固件版本', d['firmwareVersion']?.toString() ?? '-'),
        ],
      ),
    );
  }

  Widget _buildTelemetryTab() {
    final d = _device ?? {};
    final voltage = (d['voltage'] as num?)?.toDouble() ?? 0;
    final current = (d['current'] as num?)?.toDouble() ?? 0;
    final power = (d['power'] as num?)?.toDouble() ?? 0;
    final temperature = (d['temperature'] as num?)?.toDouble() ?? 0;
    final soc = (d['soc'] as num?)?.toDouble() ?? 0;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppTheme.spacingLg),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(child: _buildTelemetryCard('电压', voltage.toStringAsFixed(1), 'V', AppTheme.brandBlue)),
              const SizedBox(width: AppTheme.spacingSm),
              Expanded(child: _buildTelemetryCard('电流', current.toStringAsFixed(1), 'A', AppTheme.success)),
            ],
          ),
          const SizedBox(height: AppTheme.spacingSm),
          Row(
            children: [
              Expanded(child: _buildTelemetryCard('功率', power.toStringAsFixed(1), 'kW', AppTheme.warning)),
              const SizedBox(width: AppTheme.spacingSm),
              Expanded(child: _buildTelemetryCard('温度', temperature.toStringAsFixed(1), '°C',
                  temperature > 60 ? AppTheme.error : AppTheme.info)),
            ],
          ),
          const SizedBox(height: AppTheme.spacingSm),
          _buildTelemetryCard('SOC', soc.toStringAsFixed(1), '%', AppTheme.success),
        ],
      ),
    );
  }

  Widget _buildFaultsTab() {
    if (_faults.isEmpty) {
      return const EmptyState(
        icon: Icons.check_circle_outline_rounded,
        title: '暂无故障记录',
        subtitle: '该设备运行正常',
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: AppTheme.spacingSm),
      itemCount: _faults.length,
      itemBuilder: (context, index) {
        final fault = _faults[index];
        final level = fault['level']?.toString() ?? 'P3';
        final color = level == 'P0'
            ? AppTheme.error
            : level == 'P1'
                ? const Color(0xFFFF7A00)
                : level == 'P2'
                    ? AppTheme.warning
                    : AppTheme.info;

        return Container(
          margin: const EdgeInsets.symmetric(
            horizontal: AppTheme.spacingLg,
            vertical: AppTheme.spacingSm,
          ),
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
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                    ),
                    child: Text(level, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color)),
                  ),
                  const SizedBox(width: AppTheme.spacingSm),
                  Expanded(
                    child: Text(fault['title']?.toString() ?? '未知故障', style: AppTheme.titleMedium),
                  ),
                ],
              ),
              const SizedBox(height: AppTheme.spacingSm),
              Text(fault['description']?.toString() ?? '', style: AppTheme.bodySmall),
              const SizedBox(height: AppTheme.spacingSm),
              Text(
                fault['createdAt']?.toString() ?? '',
                style: AppTheme.caption,
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildInfoCard(String label, String value) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppTheme.spacingSm),
      padding: const EdgeInsets.symmetric(horizontal: AppTheme.spacingLg, vertical: 14),
      decoration: BoxDecoration(
        color: AppTheme.backgroundWhite,
        borderRadius: BorderRadius.circular(AppTheme.radiusMd),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: AppTheme.bodySmall.copyWith(color: AppTheme.textSecondary)),
          Text(value, style: AppTheme.bodyMedium.copyWith(fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  Widget _buildTelemetryCard(String label, String value, String unit, Color color) {
    return Container(
      padding: const EdgeInsets.all(AppTheme.spacingLg),
      decoration: BoxDecoration(
        color: AppTheme.backgroundWhite,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
      ),
      child: Column(
        children: [
          Text(label, style: AppTheme.bodySmall.copyWith(color: AppTheme.textSecondary)),
          const SizedBox(height: AppTheme.spacingSm),
          Text(
            value,
            style: AppTheme.numberLarge.copyWith(color: color, fontSize: 28),
          ),
          Text(unit, style: AppTheme.caption),
        ],
      ),
    );
  }
}
