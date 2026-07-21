import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:ops_flutter/core/router/app_router.dart';
import 'package:ops_flutter/core/theme/app_theme.dart';

/// Root scaffold with bottom navigation bar for the main tabs.
/// Uses [StatefulShellRoute] to preserve tab state across navigation.
class AppScaffold extends StatelessWidget {
  final StatefulNavigationShell navigationShell;

  const AppScaffold({super.key, required this.navigationShell});

  static const _tabs = [
    _TabItem(
      icon: Icons.dashboard_rounded,
      label: '工作台',
      path: RoutePaths.home,
    ),
    _TabItem(
      icon: Icons.warning_amber_rounded,
      label: '告警',
      path: RoutePaths.alerts,
    ),
    _TabItem(
      icon: Icons.notifications_rounded,
      label: '消息',
      path: RoutePaths.messages,
    ),
    _TabItem(
      icon: Icons.receipt_long_rounded,
      label: '工单',
      path: RoutePaths.workOrders,
    ),
    _TabItem(
      icon: Icons.person_rounded,
      label: '我的',
      path: RoutePaths.profile,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final currentIndex = navigationShell.currentIndex;

    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: currentIndex,
        onTap: (index) {
          if (index != currentIndex) {
            navigationShell.goBranch(
              index,
              initialLocation: index == navigationShell.currentIndex,
            );
          }
        },
        items: _tabs
            .map((tab) => BottomNavigationBarItem(
                  icon: Icon(tab.icon),
                  activeIcon: Icon(tab.icon, color: AppTheme.brandBlue),
                  label: tab.label,
                ))
            .toList(),
      ),
    );
  }
}

class _TabItem {
  final IconData icon;
  final String label;
  final String path;

  const _TabItem({
    required this.icon,
    required this.label,
    required this.path,
  });
}
