import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_easyloading/flutter_easyloading.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'package:ops_flutter/core/network/api_client.dart';
import 'package:ops_flutter/core/network/api_endpoints.dart';
import 'package:ops_flutter/core/providers/auth_provider.dart';
import 'package:ops_flutter/core/theme/app_theme.dart';

class ChangePasswordPage extends StatefulWidget {
  const ChangePasswordPage({super.key});

  @override
  State<ChangePasswordPage> createState() => _ChangePasswordPageState();
}

class _ChangePasswordPageState extends State<ChangePasswordPage> {
  final _formKey = GlobalKey<FormState>();
  final _oldPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _obscureOld = true;
  bool _obscureNew = true;
  bool _obscureConfirm = true;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _oldPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);
    try {
      await ApiClient.instance.post(
        '${ApiEndpoints.getUserInfo}/change-password',
        data: {
          'oldPassword': _oldPasswordController.text,
          'newPassword': _newPasswordController.text,
        },
      );
      if (mounted) {
        EasyLoading.showSuccess('密码修改成功，请重新登录');
        await context.read<AuthProvider>().logout();
      }
    } on DioException catch (e) {
      if (mounted) {
        EasyLoading.showError(e.message ?? '修改失败');
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        title: const Text('修改密码'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 20),
          onPressed: () => context.pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppTheme.spacingLg),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildField(
                '当前密码',
                _oldPasswordController,
                '请输入当前密码',
                obscure: _obscureOld,
                onToggle: () => setState(() => _obscureOld = !_obscureOld),
              ),
              const SizedBox(height: AppTheme.spacingLg),
              _buildField(
                '新密码',
                _newPasswordController,
                '请输入新密码（至少6位）',
                obscure: _obscureNew,
                onToggle: () => setState(() => _obscureNew = !_obscureNew),
                validator: (v) {
                  if (v == null || v.isEmpty) return '请输入新密码';
                  if (v.length < 6) return '密码至少6位';
                  return null;
                },
              ),
              const SizedBox(height: AppTheme.spacingLg),
              _buildField(
                '确认新密码',
                _confirmController,
                '请再次输入新密码',
                obscure: _obscureConfirm,
                onToggle: () => setState(() => _obscureConfirm = !_obscureConfirm),
                validator: (v) {
                  if (v != _newPasswordController.text) return '两次密码不一致';
                  return null;
                },
              ),
              const SizedBox(height: AppTheme.spacingXxl),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _submit,
                  child: _isSubmitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : const Text('确认修改'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildField(
    String label,
    TextEditingController controller,
    String hint, {
    required bool obscure,
    required VoidCallback onToggle,
    String? Function(String?)? validator,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTheme.bodyMedium.copyWith(fontWeight: FontWeight.w500)),
        const SizedBox(height: AppTheme.spacingSm),
        TextFormField(
          controller: controller,
          obscureText: obscure,
          decoration: InputDecoration(
            hintText: hint,
            suffixIcon: IconButton(
              icon: Icon(obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined, size: 20),
              onPressed: onToggle,
            ),
          ),
          validator: validator ?? (v) => v == null || v.isEmpty ? '请输入$label' : null,
        ),
      ],
    );
  }
}
