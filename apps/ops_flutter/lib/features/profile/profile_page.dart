import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:ops_flutter/core/providers/auth_provider.dart';
import 'package:ops_flutter/core/router/app_router.dart';
import 'package:ops_flutter/core/theme/app_theme.dart';
import 'package:provider/provider.dart';

/// Profile / "My" page for the ops app.
///
/// Displays user info, work stats, menu items, and logout action.
class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  // ── Mock work stats (replace with real API data) ──────────────
  final int _monthlyOrders = 36;
  final int _monthlyInspections = 12;
  final int _handledAlerts = 8;

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.currentUser;

    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      body: Column(
        children: [
          // ── Blue gradient header with user info ───────────────
          _buildHeader(user),

          // ── Scrollable content ────────────────────────────────
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(
                horizontal: AppTheme.spacingLg,
                vertical: AppTheme.spacingMd,
              ),
              children: [
                // Work stats bar
                _buildWorkStats(),
                const SizedBox(height: AppTheme.spacingMd),

                // Function menu group 1
                _buildMenuGroup(items: [
                  _MenuItem(
                    icon: Icons.menu_book_rounded,
                    label: '知识库',
                    onTap: () {},
                  ),
                  _MenuItem(
                    icon: Icons.inventory_2_rounded,
                    label: '备件管理',
                    onTap: () {},
                  ),
                  _MenuItem(
                    icon: Icons.swap_horiz_rounded,
                    label: '交接班',
                    onTap: () {},
                  ),
                  _MenuItem(
                    icon: Icons.settings_rounded,
                    label: '设置',
                    onTap: () => context.push(RoutePaths.settings),
                  ),
                ]),
                const SizedBox(height: AppTheme.spacingMd),

                // Function menu group 2
                _buildMenuGroup(items: [
                  _MenuItem(
                    icon: Icons.info_outline_rounded,
                    label: '关于',
                    onTap: () => context.push(RoutePaths.about),
                  ),
                ]),
                const SizedBox(height: AppTheme.spacingMd),

                // Logout button
                _buildLogoutButton(context),
                const SizedBox(height: AppTheme.spacingXxl),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── Header ────────────────────────────────────────────────────

  Widget _buildHeader(dynamic user) {
    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppTheme.brandBlue,
            AppTheme.brandBlueLight,
          ],
        ),
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(
            AppTheme.spacingLg,
            AppTheme.spacingLg,
            AppTheme.spacingLg,
            AppTheme.spacingXl,
          ),
          child: Row(
            children: [
              // Avatar
              _buildAvatar(user),
              const SizedBox(width: AppTheme.spacingLg),

              // Name + role + phone
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            user?.realName ?? '未登录',
                            style: AppTheme.titleLarge.copyWith(
                              color: AppTheme.textWhite,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: AppTheme.spacingSm),
                        _RoleTag(role: user?.role ?? ''),
                      ],
                    ),
                    const SizedBox(height: AppTheme.spacingXs),
                    Text(
                      _formatPhone(user?.phone ?? ''),
                      style: AppTheme.bodyMedium.copyWith(
                        color: AppTheme.textWhite.withValues(alpha: 0.85),
                      ),
                    ),
                  ],
                ),
              ),

              // Edit icon
              IconButton(
                onPressed: () => context.push(RoutePaths.profileEdit),
                icon: const Icon(
                  Icons.edit_rounded,
                  color: AppTheme.textWhite,
                  size: 20,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAvatar(dynamic user) {
    final hasAvatar = user?.avatar != null && user!.avatar!.isNotEmpty;

    return Container(
      width: 64,
      height: 64,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: AppTheme.textWhite.withValues(alpha: 0.2),
        border: Border.all(
          color: AppTheme.textWhite.withValues(alpha: 0.4),
          width: 2,
        ),
      ),
      child: ClipOval(
        child: hasAvatar
            ? Image.network(
                user!.avatar!,
                width: 64,
                height: 64,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => _defaultAvatarIcon(),
              )
            : _defaultAvatarIcon(),
      ),
    );
  }

  Widget _defaultAvatarIcon() {
    return Container(
      width: 64,
      height: 64,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: AppTheme.textWhite.withValues(alpha: 0.2),
      ),
      child: const Icon(
        Icons.person_rounded,
        color: AppTheme.textWhite,
        size: 36,
      ),
    );
  }

  // ── Work Stats ────────────────────────────────────────────────

  Widget _buildWorkStats() {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppTheme.spacingLg,
        vertical: AppTheme.spacingMd,
      ),
      decoration: BoxDecoration(
        color: AppTheme.backgroundWhite,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        border: Border.all(color: AppTheme.border, width: 0.5),
      ),
      child: Row(
        children: [
          _StatItem(
            value: _monthlyOrders.toString(),
            label: '本月工单',
          ),
          _divider(),
          _StatItem(
            value: _monthlyInspections.toString(),
            label: '本月巡检',
          ),
          _divider(),
          _StatItem(
            value: _handledAlerts.toString(),
            label: '处理告警',
          ),
        ],
      ),
    );
  }

  Widget _divider() {
    return Container(
      width: 1,
      height: 32,
      margin: const EdgeInsets.symmetric(horizontal: AppTheme.spacingLg),
      color: AppTheme.divider,
    );
  }

  // ── Menu Group ────────────────────────────────────────────────

  Widget _buildMenuGroup({required List<_MenuItem> items}) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.backgroundWhite,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        border: Border.all(color: AppTheme.border, width: 0.5),
      ),
      child: Column(
        children: [
          for (var i = 0; i < items.length; i++) ...[
            _buildMenuTile(items[i]),
            if (i < items.length - 1)
              const Divider(height: 1, indent: 52),
          ],
        ],
      ),
    );
  }

  Widget _buildMenuTile(_MenuItem item) {
    return InkWell(
      onTap: item.onTap,
      borderRadius: BorderRadius.circular(AppTheme.radiusLg),
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppTheme.spacingLg,
          vertical: AppTheme.spacingMd,
        ),
        child: Row(
          children: [
            Icon(
              item.icon,
              size: 22,
              color: AppTheme.textSecondary,
            ),
            const SizedBox(width: AppTheme.spacingMd),
            Expanded(
              child: Text(
                item.label,
                style: AppTheme.bodyMedium,
              ),
            ),
            Icon(
              Icons.chevron_right_rounded,
              size: 20,
              color: AppTheme.textHint,
            ),
          ],
        ),
      ),
    );
  }

  // ── Logout Button ─────────────────────────────────────────────

  Widget _buildLogoutButton(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton(
        onPressed: () => _showLogoutDialog(context),
        style: OutlinedButton.styleFrom(
          foregroundColor: AppTheme.error,
          side: const BorderSide(color: AppTheme.error, width: 1),
          padding: const EdgeInsets.symmetric(
            vertical: AppTheme.spacingMd,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppTheme.radiusMd),
          ),
        ),
        child: const Text('退出登录'),
      ),
    );
  }

  void _showLogoutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('退出登录'),
        content: const Text('确定要退出当前账号吗？'),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('取消'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              context.read<AuthProvider>().logout();
              context.go(RoutePaths.login);
            },
            child: const Text(
              '确定退出',
              style: TextStyle(color: AppTheme.error),
            ),
          ),
        ],
      ),
    );
  }

  // ── Helpers ───────────────────────────────────────────────────

  String _formatPhone(String phone) {
    if (phone.length == 11) {
      return '${phone.substring(0, 3)} ${phone.substring(3, 7)} ${phone.substring(7)}';
    }
    return phone;
  }
}

// ── Private helpers ─────────────────────────────────────────────

class _RoleTag extends StatelessWidget {
  final String role;
  const _RoleTag({required this.role});

  @override
  Widget build(BuildContext context) {
    if (role.isEmpty) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppTheme.spacingSm,
        vertical: 2,
      ),
      decoration: BoxDecoration(
        color: AppTheme.textWhite.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(AppTheme.radiusSm),
      ),
      child: Text(
        role,
        style: const TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w500,
          color: AppTheme.textWhite,
        ),
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  final String value;
  final String label;
  const _StatItem({required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            value,
            style: AppTheme.numberMedium.copyWith(color: AppTheme.brandBlue),
          ),
          const SizedBox(height: AppTheme.spacingXs),
          Text(label, style: AppTheme.bodySmall),
        ],
      ),
    );
  }
}

class _MenuItem {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _MenuItem({
    required this.icon,
    required this.label,
    required this.onTap,
  });
}
