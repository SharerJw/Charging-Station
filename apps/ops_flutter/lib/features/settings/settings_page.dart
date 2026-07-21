import 'package:flutter/material.dart';
import 'package:flutter_easyloading/flutter_easyloading.dart';
import 'package:go_router/go_router.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:provider/provider.dart';

import 'package:ops_flutter/core/providers/auth_provider.dart';
import 'package:ops_flutter/core/router/app_router.dart';
import 'package:ops_flutter/core/theme/app_theme.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  String _appVersion = '';

  @override
  void initState() {
    super.initState();
    _loadVersion();
  }

  Future<void> _loadVersion() async {
    final info = await PackageInfo.fromPlatform();
    if (mounted) {
      setState(() => _appVersion = '${info.version}+${info.buildNumber}');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        title: const Text('设置'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 20),
          onPressed: () => context.pop(),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(vertical: AppTheme.spacingLg),
        children: [
          _buildGroup('账号', [
            _buildItem(Icons.person_outline_rounded, '编辑资料', () {
              context.push(RoutePaths.profileEdit);
            }),
            _buildItem(Icons.lock_outline_rounded, '修改密码', () {
              context.push(RoutePaths.changePassword);
            }),
          ]),
          const SizedBox(height: AppTheme.spacingLg),
          _buildGroup('通知', [
            _buildItem(Icons.notifications_none_rounded, '通知设置', () {
              context.push(RoutePaths.notificationSettings);
            }),
          ]),
          const SizedBox(height: AppTheme.spacingLg),
          _buildGroup('关于', [
            _buildItem(Icons.info_outline_rounded, '关于', () {
              context.push(RoutePaths.about);
            }, trailing: Text(_appVersion, style: AppTheme.caption)),
          ]),
          const SizedBox(height: AppTheme.spacingXxl),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppTheme.spacingLg),
            child: SizedBox(
              width: double.infinity,
              height: 48,
              child: OutlinedButton(
                onPressed: () => _confirmLogout(context),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppTheme.error,
                  side: const BorderSide(color: AppTheme.error),
                ),
                child: const Text('退出登录'),
              ),
            ),
          ),
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

  Widget _buildItem(IconData icon, String label, VoidCallback onTap, {Widget? trailing}) {
    return ListTile(
      leading: Icon(icon, color: AppTheme.brandBlue, size: 22),
      title: Text(label, style: AppTheme.bodyMedium),
      trailing: trailing ?? const Icon(Icons.chevron_right_rounded, size: 20, color: AppTheme.textHint),
      onTap: onTap,
    );
  }

  Future<void> _confirmLogout(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('退出登录'),
        content: const Text('确认退出当前账号？'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('取消')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.error),
            child: const Text('确认退出'),
          ),
        ],
      ),
    );
    if (confirmed == true && context.mounted) {
      await context.read<AuthProvider>().logout();
      EasyLoading.showSuccess('已退出登录');
    }
  }
}
