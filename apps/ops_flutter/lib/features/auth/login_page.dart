import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:ops_flutter/core/providers/auth_provider.dart';
import 'package:ops_flutter/core/router/app_router.dart';
import 'package:ops_flutter/core/theme/app_theme.dart';

/// Login page for the EV operations assistant.
///
/// Features:
/// - Brand logo + app name
/// - Username / password fields with validation
/// - Loading state via [AuthProvider]
/// - Demo account hint
/// - Copyright footer
class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    final auth = context.read<AuthProvider>();
    final success = await auth.login(
      username: _usernameController.text.trim(),
      password: _passwordController.text,
    );

    if (!mounted) return;

    if (success) {
      context.go(RoutePaths.home);
    } else if (auth.error != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(auth.error!),
          backgroundColor: AppTheme.error,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppTheme.radiusSm),
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      backgroundColor: AppTheme.backgroundWhite,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(
              horizontal: AppTheme.spacingXxl,
            ),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // ── Logo & App Name ─────────────────────────
                  _buildLogo(),
                  const SizedBox(height: AppTheme.spacingXl),

                  // ── Username Field ──────────────────────────
                  _buildUsernameField(),
                  const SizedBox(height: AppTheme.spacingLg),

                  // ── Password Field ──────────────────────────
                  _buildPasswordField(),
                  const SizedBox(height: AppTheme.spacingSm),

                  // ── Demo Account Hint ───────────────────────
                  _buildDemoHint(),
                  const SizedBox(height: AppTheme.spacingXl),

                  // ── Login Button ────────────────────────────
                  _buildLoginButton(auth.isLoading),
                  const SizedBox(height: AppTheme.spacingXxl),

                  // ── Copyright ───────────────────────────────
                  _buildCopyright(),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  // ── Widgets ──────────────────────────────────────────────────

  Widget _buildLogo() {
    return Column(
      children: [
        // Brand icon
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: AppTheme.brandBlue,
            borderRadius: BorderRadius.circular(AppTheme.radiusLg),
          ),
          child: const Icon(
            Icons.ev_station,
            size: 44,
            color: AppTheme.textOnPrimary,
          ),
        ),
        const SizedBox(height: AppTheme.spacingLg),
        // App name
        const Text(
          '运维助手',
          style: AppTheme.headingLarge,
        ),
        const SizedBox(height: AppTheme.spacingXs),
        Text(
          'EV 充电站运维管理平台',
          style: AppTheme.bodyMedium.copyWith(
            color: AppTheme.textSecondary,
          ),
        ),
      ],
    );
  }

  Widget _buildUsernameField() {
    return TextFormField(
      controller: _usernameController,
      keyboardType: TextInputType.text,
      textInputAction: TextInputAction.next,
      decoration: const InputDecoration(
        labelText: '用户名',
        hintText: '请输入用户名',
        prefixIcon: Icon(Icons.person_outline),
      ),
      validator: (value) {
        if (value == null || value.trim().isEmpty) {
          return '请输入用户名';
        }
        return null;
      },
    );
  }

  Widget _buildPasswordField() {
    return TextFormField(
      controller: _passwordController,
      obscureText: _obscurePassword,
      textInputAction: TextInputAction.done,
      onFieldSubmitted: (_) => _handleLogin(),
      decoration: InputDecoration(
        labelText: '密码',
        hintText: '请输入密码',
        prefixIcon: const Icon(Icons.lock_outline),
        suffixIcon: IconButton(
          icon: Icon(
            _obscurePassword
                ? Icons.visibility_off_outlined
                : Icons.visibility_outlined,
          ),
          onPressed: () {
            setState(() {
              _obscurePassword = !_obscurePassword;
            });
          },
        ),
      ),
      validator: (value) {
        if (value == null || value.isEmpty) {
          return '请输入密码';
        }
        return null;
      },
    );
  }

  Widget _buildDemoHint() {
    return Align(
      alignment: Alignment.centerRight,
      child: Text(
        '演示账号: ops1 / ops123',
        style: AppTheme.bodySmall.copyWith(
          color: AppTheme.textHint,
          fontSize: 12,
        ),
      ),
    );
  }

  Widget _buildLoginButton(bool isLoading) {
    return SizedBox(
      width: double.infinity,
      height: 48,
      child: ElevatedButton(
        onPressed: isLoading ? null : _handleLogin,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppTheme.brandBlue,
          foregroundColor: AppTheme.textOnPrimary,
          disabledBackgroundColor: AppTheme.brandBlue.withOpacity(0.6),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppTheme.radiusMd),
          ),
          elevation: 0,
        ),
        child: isLoading
            ? const SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  color: AppTheme.textOnPrimary,
                ),
              )
            : const Text(
                '登录',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
      ),
    );
  }

  Widget _buildCopyright() {
    return Text(
      '© 2026 EV Charging Platform. All rights reserved.',
      style: AppTheme.caption.copyWith(
        color: AppTheme.textHint,
      ),
    );
  }
}
