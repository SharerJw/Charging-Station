import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'package:ops_flutter/core/theme/app_theme.dart';

class NotificationSettingsPage extends StatefulWidget {
  const NotificationSettingsPage({super.key});

  @override
  State<NotificationSettingsPage> createState() => _NotificationSettingsPageState();
}

class _NotificationSettingsPageState extends State<NotificationSettingsPage> {
  bool _workOrderNotify = true;
  bool _alertNotify = true;
  bool _inspectionNotify = true;
  bool _systemNotify = true;
  bool _soundEnabled = true;
  bool _vibrationEnabled = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        title: const Text('通知设置'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 20),
          onPressed: () => context.pop(),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(vertical: AppTheme.spacingLg),
        children: [
          _buildGroup('消息类型', [
            _buildSwitch('工单通知', '接单、派单、工单状态变更', _workOrderNotify,
                (v) => setState(() => _workOrderNotify = v)),
            _buildSwitch('告警通知', '设备告警、告警处理提醒', _alertNotify,
                (v) => setState(() => _alertNotify = v)),
            _buildSwitch('巡检通知', '巡检任务分配、到期提醒', _inspectionNotify,
                (v) => setState(() => _inspectionNotify = v)),
            _buildSwitch('系统通知', '系统更新、维护公告', _systemNotify,
                (v) => setState(() => _systemNotify = v)),
          ]),
          const SizedBox(height: AppTheme.spacingLg),
          _buildGroup('提醒方式', [
            _buildSwitch('声音提醒', '收到消息时播放提示音', _soundEnabled,
                (v) => setState(() => _soundEnabled = v)),
            _buildSwitch('振动提醒', '收到消息时振动', _vibrationEnabled,
                (v) => setState(() => _vibrationEnabled = v)),
          ]),
        ],
      ),
    );
  }

  Widget _buildGroup(String title, List<Widget> items) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppTheme.spacingLg),
          child: Text(title, style: AppTheme.bodySmall.copyWith(color: AppTheme.textSecondary)),
        ),
        const SizedBox(height: AppTheme.spacingSm),
        Container(
          margin: const EdgeInsets.symmetric(horizontal: AppTheme.spacingLg),
          decoration: BoxDecoration(
            color: AppTheme.backgroundWhite,
            borderRadius: BorderRadius.circular(AppTheme.radiusLg),
          ),
          child: Column(children: items),
        ),
      ],
    );
  }

  Widget _buildSwitch(String title, String subtitle, bool value, ValueChanged<bool> onChanged) {
    return SwitchListTile(
      title: Text(title, style: AppTheme.bodyMedium),
      subtitle: Text(subtitle, style: AppTheme.caption),
      value: value,
      onChanged: onChanged,
      activeColor: AppTheme.brandBlue,
    );
  }
}
