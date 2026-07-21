import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import 'package:ops_flutter/core/network/api_client.dart';
import 'package:ops_flutter/core/network/api_endpoints.dart';
import 'package:ops_flutter/core/theme/app_theme.dart';

/// Work order processing form page.
/// Covers: fault reason selection, photo upload, spare parts, test result, and notes.
class WorkOrderProcessPage extends StatefulWidget {
  final String workOrderId;

  const WorkOrderProcessPage({super.key, required this.workOrderId});

  @override
  State<WorkOrderProcessPage> createState() => _WorkOrderProcessPageState();
}

class _WorkOrderProcessPageState extends State<WorkOrderProcessPage> {
  // ── Form ──────────────────────────────────────────────────────
  final _formKey = GlobalKey<FormState>();
  final _noteController = TextEditingController();
  final _testResultController = TextEditingController();

  // ── Three-level cascading fault reason ────────────────────────
  String? _selectedLevel1;
  String? _selectedLevel2;
  String? _selectedLevel3;

  // Mock data for three-level cascade
  static const Map<String, Map<String, List<String>>> _faultReasons = {
    '硬件故障': {
      '充电模块': ['模块过温', '模块通信异常', '模块输出异常'],
      '显示屏': ['屏幕黑屏', '屏幕触摸失灵', '显示花屏'],
      '充电枪': ['枪锁异常', '枪线破损', 'CP信号异常'],
    },
    '软件故障': {
      '系统异常': ['系统死机', '系统重启', '固件升级失败'],
      '通信故障': ['4G通信异常', '以太网断开', 'OCPP通信超时'],
      '计费异常': ['费率配置错误', '计费不准确', '订单生成失败'],
    },
    '外部因素': {
      '供电问题': ['供电电压异常', '停电', 'UPS故障'],
      '环境问题': ['高温保护', '进水', '粉尘堆积'],
      '人为因素': ['用户误操作', '外力损坏', '施工损坏'],
    },
  };

  // ── Photo upload ──────────────────────────────────────────────
  final List<File> _photos = [];
  static const int _maxPhotos = 6;
  final ImagePicker _picker = ImagePicker();

  // ── Spare parts ──────────────────────────────────────────────
  final List<_SparePartEntry> _spareParts = [];
  int _sparePartCounter = 0;

  // ── Submit state ─────────────────────────────────────────────
  bool _isSubmitting = false;

  @override
  void dispose() {
    _noteController.dispose();
    _testResultController.dispose();
    super.dispose();
  }

  // ── Photo methods ────────────────────────────────────────────
  Future<void> _pickPhoto(ImageSource source) async {
    if (_photos.length >= _maxPhotos) return;
    final XFile? image = await _picker.pickImage(
      source: source,
      maxWidth: 1920,
      maxHeight: 1920,
      imageQuality: 85,
    );
    if (image != null) {
      setState(() {
        _photos.add(File(image.path));
      });
    }
  }

  void _removePhoto(int index) {
    setState(() {
      _photos.removeAt(index);
    });
  }

  void _showPhotoSourcePicker() {
    if (_photos.length >= _maxPhotos) return;
    showModalBottomSheet<void>(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt_rounded),
              title: const Text('拍照'),
              onTap: () {
                Navigator.pop(context);
                _pickPhoto(ImageSource.camera);
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library_rounded),
              title: const Text('从相册选择'),
              onTap: () {
                Navigator.pop(context);
                _pickPhoto(ImageSource.gallery);
              },
            ),
          ],
        ),
      ),
    );
  }

  // ── Spare part methods ───────────────────────────────────────
  void _addSparePart() {
    setState(() {
      _sparePartCounter++;
      _spareParts.add(_SparePartEntry(
        id: '$_sparePartCounter',
        nameController: TextEditingController(),
        quantityController: TextEditingController(text: '1'),
      ));
    });
  }

  void _removeSparePart(String id) {
    setState(() {
      final entry = _spareParts.firstWhere((e) => e.id == id);
      entry.nameController.dispose();
      entry.quantityController.dispose();
      _spareParts.removeWhere((e) => e.id == id);
    });
  }

  // ── Submit ───────────────────────────────────────────────────
  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isSubmitting = true;
    });

    try {
      // Build the process payload
      final faultReason = <String>[];
      if (_selectedLevel1 != null) faultReason.add(_selectedLevel1!);
      if (_selectedLevel2 != null) faultReason.add(_selectedLevel2!);
      if (_selectedLevel3 != null) faultReason.add(_selectedLevel3!);

      final sparePartsData = _spareParts
          .where((e) => e.nameController.text.isNotEmpty)
          .map((e) => {
                'name': e.nameController.text,
                'quantity': int.tryParse(e.quantityController.text) ?? 1,
              })
          .toList();

      final payload = {
        'faultReason': faultReason.join(' > '),
        'testResult': _testResultController.text,
        'processNote': _noteController.text,
        'spareParts': sparePartsData,
      };

      await ApiClient.instance.post(
        ApiEndpoints.workOrderComplete(widget.workOrderId),
        data: payload,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('工单处理提交成功')),
        );
        context.pop();
      }
    } on DioException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message ?? '提交失败')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('提交失败，请重试')),
        );
      }
    } finally {
      setState(() {
        _isSubmitting = false;
      });
    }
  }

  // ── Build ────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        title: const Text('工单处理'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 20),
          onPressed: () => context.pop(),
        ),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(AppTheme.spacingLg),
          children: [
            // ── Fault Reason (three-level cascade) ────────────
            _buildSection(
              title: '故障原因',
              icon: Icons.bug_report_outlined,
              child: _buildFaultReasonCascade(),
            ),
            const SizedBox(height: AppTheme.spacingLg),

            // ── Photo upload ──────────────────────────────────
            _buildSection(
              title: '维修照片',
              icon: Icons.photo_camera_outlined,
              child: _buildPhotoUpload(),
            ),
            const SizedBox(height: AppTheme.spacingLg),

            // ── Spare parts ───────────────────────────────────
            _buildSection(
              title: '备件消耗',
              icon: Icons.inventory_2_outlined,
              child: _buildSpareParts(),
            ),
            const SizedBox(height: AppTheme.spacingLg),

            // ── Test result ───────────────────────────────────
            _buildSection(
              title: '测试结果',
              icon: Icons.science_outlined,
              child: _buildTestResult(),
            ),
            const SizedBox(height: AppTheme.spacingLg),

            // ── Process note ──────────────────────────────────
            _buildSection(
              title: '处理备注',
              icon: Icons.note_alt_outlined,
              child: _buildProcessNote(),
            ),
            const SizedBox(height: AppTheme.spacingXxl),

            // ── Submit button ─────────────────────────────────
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: _isSubmitting ? null : _submit,
                child: _isSubmitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: AppTheme.textWhite,
                        ),
                      )
                    : const Text('提交处理结果'),
              ),
            ),
            const SizedBox(height: AppTheme.spacingXl),
          ],
        ),
      ),
    );
  }

  // ── Section wrapper ──────────────────────────────────────────
  Widget _buildSection({
    required String title,
    required IconData icon,
    required Widget child,
  }) {
    return Container(
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
              Icon(icon, size: 18, color: AppTheme.brandBlue),
              const SizedBox(width: AppTheme.spacingSm),
              Text(title, style: AppTheme.titleMedium),
            ],
          ),
          const SizedBox(height: AppTheme.spacingMd),
          child,
        ],
      ),
    );
  }

  // ── Three-level cascading fault reason ────────────────────────
  Widget _buildFaultReasonCascade() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Level 1
        DropdownButtonFormField<String>(
          value: _selectedLevel1,
          decoration: const InputDecoration(
            hintText: '选择故障大类',
            contentPadding: EdgeInsets.symmetric(
              horizontal: AppTheme.spacingLg,
              vertical: AppTheme.spacingMd,
            ),
          ),
          items: _faultReasons.keys.map((String value) {
            return DropdownMenuItem<String>(
              value: value,
              child: Text(value),
            );
          }).toList(),
          onChanged: (value) {
            setState(() {
              _selectedLevel1 = value;
              _selectedLevel2 = null;
              _selectedLevel3 = null;
            });
          },
        ),
        if (_selectedLevel1 != null) ...[
          const SizedBox(height: AppTheme.spacingMd),
          // Level 2
          DropdownButtonFormField<String>(
            value: _selectedLevel2,
            decoration: const InputDecoration(
              hintText: '选择故障子类',
              contentPadding: EdgeInsets.symmetric(
                horizontal: AppTheme.spacingLg,
                vertical: AppTheme.spacingMd,
              ),
            ),
            items: (_faultReasons[_selectedLevel1]?.keys.toList() ?? [])
                .map((String value) {
              return DropdownMenuItem<String>(
                value: value,
                child: Text(value),
              );
            }).toList(),
            onChanged: (value) {
              setState(() {
                _selectedLevel2 = value;
                _selectedLevel3 = null;
              });
            },
          ),
        ],
        if (_selectedLevel2 != null) ...[
          const SizedBox(height: AppTheme.spacingMd),
          // Level 3
          DropdownButtonFormField<String>(
            value: _selectedLevel3,
            decoration: const InputDecoration(
              hintText: '选择具体原因',
              contentPadding: EdgeInsets.symmetric(
                horizontal: AppTheme.spacingLg,
                vertical: AppTheme.spacingMd,
              ),
            ),
            items: (_faultReasons[_selectedLevel1]?[_selectedLevel2]
                        ?.toList() ??
                    [])
                .map((String value) {
              return DropdownMenuItem<String>(
                value: value,
                child: Text(value),
              );
            }).toList(),
            onChanged: (value) {
              setState(() {
                _selectedLevel3 = value;
              });
            },
          ),
        ],
      ],
    );
  }

  // ── Photo upload grid ────────────────────────────────────────
  Widget _buildPhotoUpload() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            crossAxisSpacing: AppTheme.spacingSm,
            mainAxisSpacing: AppTheme.spacingSm,
          ),
          itemCount: _photos.length + (_photos.length < _maxPhotos ? 1 : 0),
          itemBuilder: (context, index) {
            if (index < _photos.length) {
              return _buildPhotoItem(index);
            }
            return _buildAddPhotoButton();
          },
        ),
        const SizedBox(height: AppTheme.spacingSm),
        Text(
          '最多上传 $_maxPhotos 张照片',
          style: AppTheme.caption,
        ),
      ],
    );
  }

  Widget _buildPhotoItem(int index) {
    return Stack(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(AppTheme.radiusMd),
          child: Image.file(
            _photos[index],
            width: double.infinity,
            height: double.infinity,
            fit: BoxFit.cover,
          ),
        ),
        Positioned(
          top: 4,
          right: 4,
          child: GestureDetector(
            onTap: () => _removePhoto(index),
            child: Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                color: Colors.black54,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.close,
                size: 14,
                color: Colors.white,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildAddPhotoButton() {
    return GestureDetector(
      onTap: _showPhotoSourcePicker,
      child: Container(
        decoration: BoxDecoration(
          color: AppTheme.backgroundLight,
          borderRadius: BorderRadius.circular(AppTheme.radiusMd),
          border: Border.all(
            color: AppTheme.border,
            width: 1,
            strokeAlign: BorderSide.strokeAlignInside,
          ),
        ),
        child: const Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.add_photo_alternate_outlined,
              size: 28,
              color: AppTheme.textHint,
            ),
            SizedBox(height: AppTheme.spacingXs),
            Text(
              '添加照片',
              style: TextStyle(fontSize: 11, color: AppTheme.textHint),
            ),
          ],
        ),
      ),
    );
  }

  // ── Spare parts ──────────────────────────────────────────────
  Widget _buildSpareParts() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (_spareParts.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: AppTheme.spacingSm),
            child: Text('暂无备件消耗记录', style: AppTheme.bodySmall),
          ),
        ..._spareParts.map((entry) {
          return Padding(
            padding: const EdgeInsets.only(bottom: AppTheme.spacingSm),
            child: Row(
              children: [
                Expanded(
                  flex: 3,
                  child: TextFormField(
                    controller: entry.nameController,
                    decoration: const InputDecoration(
                      hintText: '备件名称',
                      contentPadding: EdgeInsets.symmetric(
                        horizontal: AppTheme.spacingLg,
                        vertical: AppTheme.spacingMd,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: AppTheme.spacingSm),
                Expanded(
                  flex: 1,
                  child: TextFormField(
                    controller: entry.quantityController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      hintText: '数量',
                      contentPadding: EdgeInsets.symmetric(
                        horizontal: AppTheme.spacingLg,
                        vertical: AppTheme.spacingMd,
                      ),
                    ),
                  ),
                ),
                IconButton(
                  onPressed: () => _removeSparePart(entry.id),
                  icon: const Icon(
                    Icons.remove_circle_outline,
                    color: AppTheme.error,
                    size: 22,
                  ),
                ),
              ],
            ),
          );
        }),
        OutlinedButton.icon(
          onPressed: _addSparePart,
          icon: const Icon(Icons.add_rounded, size: 18),
          label: const Text('添加备件'),
        ),
      ],
    );
  }

  // ── Test result ──────────────────────────────────────────────
  Widget _buildTestResult() {
    return TextFormField(
      controller: _testResultController,
      maxLines: 3,
      decoration: const InputDecoration(
        hintText: '请输入测试结果，如：充电测试通过、通信正常...',
        contentPadding: EdgeInsets.symmetric(
          horizontal: AppTheme.spacingLg,
          vertical: AppTheme.spacingMd,
        ),
      ),
    );
  }

  // ── Process note ─────────────────────────────────────────────
  Widget _buildProcessNote() {
    return TextFormField(
      controller: _noteController,
      maxLines: 4,
      decoration: const InputDecoration(
        hintText: '请输入处理备注...',
        contentPadding: EdgeInsets.symmetric(
          horizontal: AppTheme.spacingLg,
          vertical: AppTheme.spacingMd,
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────
// Spare Part Entry
// ──────────────────────────────────────────────────────────────

class _SparePartEntry {
  final String id;
  final TextEditingController nameController;
  final TextEditingController quantityController;

  const _SparePartEntry({
    required this.id,
    required this.nameController,
    required this.quantityController,
  });
}
