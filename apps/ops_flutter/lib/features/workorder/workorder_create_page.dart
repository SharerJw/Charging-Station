import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_easyloading/flutter_easyloading.dart';
import 'package:go_router/go_router.dart';

import 'package:ops_flutter/core/network/api_client.dart';
import 'package:ops_flutter/core/network/api_endpoints.dart';
import 'package:ops_flutter/core/theme/app_theme.dart';

class WorkOrderCreatePage extends StatefulWidget {
  const WorkOrderCreatePage({super.key});

  @override
  State<WorkOrderCreatePage> createState() => _WorkOrderCreatePageState();
}

class _WorkOrderCreatePageState extends State<WorkOrderCreatePage> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descController = TextEditingController();

  String _type = 'FAULT_REPAIR';
  String _priority = 'MEDIUM';
  String? _stationId;
  String? _deviceId;
  bool _isSubmitting = false;

  static const _types = {
    'FAULT_REPAIR': '故障维修',
    'ROUTINE_MAINTENANCE': '例行保养',
    'INSTALLATION': '安装调试',
    'UPGRADE': '升级改造',
  };
  static const _priorities = {
    'HIGH': '高',
    'MEDIUM': '中',
    'LOW': '低',
  };

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);
    try {
      await ApiClient.instance.post(
        ApiEndpoints.workOrderCreate,
        data: {
          'title': _titleController.text.trim(),
          'description': _descController.text.trim(),
          'type': _type,
          'priority': _priority,
          if (_stationId != null) 'stationId': _stationId,
          if (_deviceId != null) 'deviceId': _deviceId,
        },
      );
      if (mounted) {
        EasyLoading.showSuccess('工单创建成功');
        context.pop();
      }
    } on DioException catch (e) {
      if (mounted) {
        EasyLoading.showError(e.message ?? '创建失败');
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
        title: const Text('新建工单'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 20),
          onPressed: () => context.pop(),
        ),
      ),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppTheme.spacingLg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildSectionTitle('工单类型'),
              const SizedBox(height: AppTheme.spacingSm),
              _buildTypeSelector(),
              const SizedBox(height: AppTheme.spacingXl),
              _buildSectionTitle('优先级'),
              const SizedBox(height: AppTheme.spacingSm),
              _buildPrioritySelector(),
              const SizedBox(height: AppTheme.spacingXl),
              _buildSectionTitle('工单标题'),
              const SizedBox(height: AppTheme.spacingSm),
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(hintText: '请输入工单标题'),
                validator: (v) => v == null || v.trim().isEmpty ? '请输入标题' : null,
              ),
              const SizedBox(height: AppTheme.spacingXl),
              _buildSectionTitle('问题描述'),
              const SizedBox(height: AppTheme.spacingSm),
              TextFormField(
                controller: _descController,
                maxLines: 5,
                decoration: const InputDecoration(hintText: '请详细描述问题'),
                validator: (v) => v == null || v.trim().isEmpty ? '请输入描述' : null,
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
                      : const Text('提交工单'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(title, style: AppTheme.titleMedium);
  }

  Widget _buildTypeSelector() {
    return Wrap(
      spacing: AppTheme.spacingSm,
      runSpacing: AppTheme.spacingSm,
      children: _types.entries.map((e) {
        final selected = _type == e.key;
        return GestureDetector(
          onTap: () => setState(() => _type = e.key),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: selected ? AppTheme.brandBlue.withValues(alpha: 0.1) : AppTheme.backgroundWhite,
              borderRadius: BorderRadius.circular(AppTheme.radiusMd),
              border: Border.all(
                color: selected ? AppTheme.brandBlue : AppTheme.border,
              ),
            ),
            child: Text(
              e.value,
              style: TextStyle(
                fontSize: 14,
                fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
                color: selected ? AppTheme.brandBlue : AppTheme.textPrimary,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildPrioritySelector() {
    return Row(
      children: _priorities.entries.map((e) {
        final selected = _priority == e.key;
        final color = e.key == 'HIGH'
            ? AppTheme.error
            : e.key == 'MEDIUM'
                ? AppTheme.warning
                : AppTheme.success;
        return Expanded(
          child: GestureDetector(
            onTap: () => setState(() => _priority = e.key),
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 4),
              padding: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                color: selected ? color.withValues(alpha: 0.1) : AppTheme.backgroundWhite,
                borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                border: Border.all(
                  color: selected ? color : AppTheme.border,
                ),
              ),
              child: Center(
                child: Text(
                  e.value,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
                    color: selected ? color : AppTheme.textPrimary,
                  ),
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}
