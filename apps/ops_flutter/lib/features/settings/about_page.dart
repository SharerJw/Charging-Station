import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:package_info_plus/package_info_plus.dart';

import 'package:ops_flutter/core/theme/app_theme.dart';

class AboutPage extends StatefulWidget {
  const AboutPage({super.key});

  @override
  State<AboutPage> createState() => _AboutPageState();
}

class _AboutPageState extends State<AboutPage> {
  String _version = '';
  String _buildNumber = '';

  @override
  void initState() {
    super.initState();
    _loadInfo();
  }

  Future<void> _loadInfo() async {
    final info = await PackageInfo.fromPlatform();
    if (mounted) {
      setState(() {
        _version = info.version;
        _buildNumber = info.buildNumber;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundWhite,
      appBar: AppBar(
        title: const Text('关于'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 20),
          onPressed: () => context.pop(),
        ),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(AppTheme.spacingXxl),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: AppTheme.brandBlue.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(AppTheme.radiusXl),
                ),
                child: const Icon(Icons.ev_station_rounded, size: 40, color: AppTheme.brandBlue),
              ),
              const SizedBox(height: AppTheme.spacingLg),
              const Text('EV 运维端', style: AppTheme.headingMedium),
              const SizedBox(height: AppTheme.spacingSm),
              Text(
                'v$_version+$_buildNumber',
                style: AppTheme.bodyMedium.copyWith(color: AppTheme.textSecondary),
              ),
              const SizedBox(height: AppTheme.spacingXxl),
              _buildInfoRow('技术栈', 'Flutter + Dart'),
              _buildInfoRow('后端', 'Java 21 + Spring Boot 3.3'),
              _buildInfoRow('协议', 'OCPP 1.6J / 2.0'),
              const SizedBox(height: AppTheme.spacingXxl),
              Text(
                'Copyright © 2026 EV Charging Platform',
                style: AppTheme.caption,
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppTheme.spacingSm),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: AppTheme.bodySmall.copyWith(color: AppTheme.textSecondary)),
          Text(value, style: AppTheme.bodyMedium),
        ],
      ),
    );
  }
}
