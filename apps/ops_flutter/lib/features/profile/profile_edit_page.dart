import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_easyloading/flutter_easyloading.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'package:ops_flutter/core/network/api_client.dart';
import 'package:ops_flutter/core/network/api_endpoints.dart';
import 'package:ops_flutter/core/providers/auth_provider.dart';
import 'package:ops_flutter/core/theme/app_theme.dart';

class ProfileEditPage extends StatefulWidget {
  const ProfileEditPage({super.key});

  @override
  State<ProfileEditPage> createState() => _ProfileEditPageState();
}

class _ProfileEditPageState extends State<ProfileEditPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthProvider>().currentUser;
    if (user != null) {
      _nameController.text = user.realName;
      _phoneController.text = user.phone;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);
    try {
      await ApiClient.instance.put(
        ApiEndpoints.getUserInfo,
        data: {
          'realName': _nameController.text.trim(),
          'phone': _phoneController.text.trim(),
        },
      );
      if (mounted) {
        EasyLoading.showSuccess('资料更新成功');
        context.pop();
      }
    } on DioException catch (e) {
      if (mounted) {
        EasyLoading.showError(e.message ?? '更新失败');
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().currentUser;

    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        title: const Text('编辑资料'),
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
            children: [
              // Avatar section
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: AppTheme.brandBlue.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.person_rounded, size: 40, color: AppTheme.brandBlue),
              ),
              const SizedBox(height: AppTheme.spacingSm),
              Text(
                user?.username ?? '',
                style: AppTheme.bodySmall.copyWith(color: AppTheme.textSecondary),
              ),
              const SizedBox(height: AppTheme.spacingXxl),

              // Form fields
              _buildField('姓名', _nameController, '请输入姓名'),
              const SizedBox(height: AppTheme.spacingLg),
              _buildField('手机号', _phoneController, '请输入手机号',
                  keyboardType: TextInputType.phone),
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
                      : const Text('保存'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildField(String label, TextEditingController controller, String hint,
      {TextInputType? keyboardType}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTheme.bodyMedium.copyWith(fontWeight: FontWeight.w500)),
        const SizedBox(height: AppTheme.spacingSm),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          decoration: InputDecoration(hintText: hint),
          validator: (v) => v == null || v.trim().isEmpty ? '请输入$label' : null,
        ),
      ],
    );
  }
}
