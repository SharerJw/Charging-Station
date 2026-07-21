import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import 'package:ops_flutter/core/network/api_client.dart';
import 'package:ops_flutter/core/network/api_endpoints.dart';
import 'package:ops_flutter/core/theme/app_theme.dart';
import 'package:ops_flutter/features/inspection/inspection_model.dart';
import 'package:ops_flutter/shared/widgets/common_widgets.dart';

/// Inspection execution page with check-in, checklist items, and submission.
class InspectionExecPage extends StatefulWidget {
  final String inspectionId;

  const InspectionExecPage({super.key, required this.inspectionId});

  @override
  State<InspectionExecPage> createState() => _InspectionExecPageState();
}

class _InspectionExecPageState extends State<InspectionExecPage> {
  // ── Data ──────────────────────────────────────────────────────
  InspectionTask? _task;
  List<_CheckItemState> _items = [];
  bool _isLoading = true;
  String? _errorMessage;

  // ── Check-in state ──────────────────────────────────────────
  bool _isCheckedIn = false;
  bool _isCheckingIn = false;

  // ── Draft / submit ──────────────────────────────────────────
  bool _isSavingDraft = false;
  bool _isSubmitting = false;

  // ── Photo picker ────────────────────────────────────────────
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _loadDetail();
  }

  Future<void> _loadDetail() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await ApiClient.instance.get(
        ApiEndpoints.inspectionDetail.replaceAll('{id}', widget.inspectionId),
      );
      final data = response.data;
      if (data != null && data is Map<String, dynamic>) {
        final task = InspectionTask.fromJson(data);
        final itemsData = data['items'] as List<dynamic>? ?? [];
        final items = itemsData
            .map((e) => _CheckItemState(
                  item: InspectionItem.fromJson(e as Map<String, dynamic>),
                ))
            .toList();
        setState(() {
          _task = task;
          _items = items;
          _isCheckedIn = task.status.toUpperCase() != 'PENDING';
        });
      }
    } on DioException catch (e) {
      setState(() {
        _errorMessage = e.message ?? '加载失败';
      });
    } catch (e) {
      setState(() {
        _errorMessage = '加载巡检详情失败';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  // ── GPS / NFC check-in ──────────────────────────────────────
  Future<void> _checkIn() async {
    setState(() {
      _isCheckingIn = true;
    });

    try {
      // Simulate GPS/NFC check-in with location verification
      await Future.delayed(const Duration(seconds: 2));

      // In production: use geolocator to verify proximity to station
      // For now, simulate a successful check-in
      setState(() {
        _isCheckedIn = true;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('签到成功，开始巡检')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('签到失败，请重试')),
        );
      }
    } finally {
      setState(() {
        _isCheckingIn = false;
      });
    }
  }

  // ── Item result update ──────────────────────────────────────
  void _updateItemResult(int index, String result) {
    setState(() {
      _items[index] = _items[index].copyWith(result: result);
    });
  }

  void _updateItemNote(int index, String note) {
    setState(() {
      _items[index] = _items[index].copyWith(note: note);
    });
  }

  // ── Photo for item ──────────────────────────────────────────
  Future<void> _pickPhotoForItem(int index) async {
    final XFile? image = await _picker.pickImage(
      source: ImageSource.camera,
      maxWidth: 1920,
      maxHeight: 1920,
      imageQuality: 85,
    );
    if (image != null) {
      setState(() {
        final currentPhotos = List<String>.from(_items[index].photos);
        currentPhotos.add(image.path);
        _items[index] = _items[index].copyWith(photos: currentPhotos);
      });
    }
  }

  // ── Save draft ──────────────────────────────────────────────
  Future<void> _saveDraft() async {
    setState(() {
      _isSavingDraft = true;
    });

    try {
      final payload = _buildPayload(isDraft: true);
      await ApiClient.instance.post(
        '${ApiEndpoints.inspections}/${widget.inspectionId}/draft',
        data: payload,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('草稿已保存')),
        );
      }
    } on DioException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message ?? '保存失败')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('保存失败，请重试')),
        );
      }
    } finally {
      setState(() {
        _isSavingDraft = false;
      });
    }
  }

  // ── Submit ───────────────────────────────────────────────────
  Future<void> _submit() async {
    // Validate: all items must have a result
    final unchecked = _items.where((i) => i.result == null).toList();
    if (unchecked.isNotEmpty) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('还有 ${unchecked.length} 项未检查，请先完成所有检查项'),
          ),
        );
      }
      return;
    }

    // Confirm if there are any failures
    final failures = _items.where((i) => i.result == 'FAIL').toList();
    if (failures.isNotEmpty) {
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('确认提交'),
          content: Text('本次巡检有 ${failures.length} 项不通过，确认提交？'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('取消'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('确认提交'),
            ),
          ],
        ),
      );
      if (confirmed != true) return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      final payload = _buildPayload(isDraft: false);
      await ApiClient.instance.post(
        ApiEndpoints.inspectionSubmit(widget.inspectionId),
        data: payload,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('巡检已提交')),
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

  Map<String, dynamic> _buildPayload({required bool isDraft}) {
    final itemsData = _items
        .map((ci) => {
              'itemId': ci.item.id,
              'result': ci.result,
              'note': ci.note,
              'photos': ci.photos,
            })
        .toList();

    return {
      'isDraft': isDraft,
      'items': itemsData,
    };
  }

  // ── Progress ──────────────────────────────────────────────────
  int get _checkedCount => _items.where((i) => i.result != null).length;
  int get _totalCount => _items.length;
  double get _progress =>
      _totalCount > 0 ? _checkedCount / _totalCount : 0.0;

  // ── Build ────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        title: const Text('巡检执行'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 20),
          onPressed: () => context.pop(),
        ),
      ),
      body: _buildBody(),
      bottomNavigationBar: _buildBottomBar(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const LoadingIndicator(message: '加载巡检项...');
    }

    if (_errorMessage != null) {
      return ErrorRetryWidget(
        message: _errorMessage!,
        onRetry: _loadDetail,
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppTheme.spacingLg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Task summary ────────────────────────────────────
          _buildTaskSummary(),
          const SizedBox(height: AppTheme.spacingLg),

          // ── Check-in button ─────────────────────────────────
          if (!_isCheckedIn) _buildCheckInCard(),
          if (!_isCheckedIn) const SizedBox(height: AppTheme.spacingLg),

          // ── Progress bar ────────────────────────────────────
          _buildProgressCard(),
          const SizedBox(height: AppTheme.spacingLg),

          // ── Check items by group ────────────────────────────
          _buildCheckItemGroups(),
        ],
      ),
    );
  }

  // ── Task summary card ────────────────────────────────────────
  Widget _buildTaskSummary() {
    final task = _task;
    if (task == null) return const SizedBox.shrink();

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
          Text(task.name, style: AppTheme.titleMedium),
          const SizedBox(height: AppTheme.spacingSm),
          Row(
            children: [
              const Icon(Icons.location_on_outlined, size: 14, color: AppTheme.textSecondary),
              const SizedBox(width: AppTheme.spacingXxs),
              Expanded(
                child: Text(task.stationName, style: AppTheme.bodySmall),
              ),
            ],
          ),
          const SizedBox(height: AppTheme.spacingXs),
          Row(
            children: [
              const Icon(Icons.numbers_rounded, size: 14, color: AppTheme.textSecondary),
              const SizedBox(width: AppTheme.spacingXxs),
              Text('任务ID: ${task.id}', style: AppTheme.bodySmall),
            ],
          ),
        ],
      ),
    );
  }

  // ── Check-in card ────────────────────────────────────────────
  Widget _buildCheckInCard() {
    return Container(
      padding: const EdgeInsets.all(AppTheme.spacingLg),
      decoration: BoxDecoration(
        color: AppTheme.backgroundWhite,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        border: Border.all(color: AppTheme.brandBlue.withValues(alpha: 0.3), width: 1),
      ),
      child: Column(
        children: [
          Icon(
            Icons.explore_rounded,
            size: 48,
            color: AppTheme.brandBlue.withValues(alpha: 0.6),
          ),
          const SizedBox(height: AppTheme.spacingMd),
          Text('请先签到', style: AppTheme.titleMedium),
          const SizedBox(height: AppTheme.spacingXs),
          Text('到达站点后进行 GPS/NFC 签到', style: AppTheme.bodySmall),
          const SizedBox(height: AppTheme.spacingLg),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton.icon(
              onPressed: _isCheckingIn ? null : _checkIn,
              icon: _isCheckingIn
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: AppTheme.textWhite,
                      ),
                    )
                  : const Icon(Icons.location_on_rounded, size: 20),
              label: Text(_isCheckingIn ? '签到中...' : 'GPS/NFC 签到'),
            ),
          ),
        ],
      ),
    );
  }

  // ── Progress card ────────────────────────────────────────────
  Widget _buildProgressCard() {
    final passCount = _items.where((i) => i.result == 'PASS').length;
    final failCount = _items.where((i) => i.result == 'FAIL').length;
    final skipCount = _items.where((i) => i.result == 'SKIP').length;

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
              const Icon(Icons.check_circle_outline, size: 18, color: AppTheme.brandBlue),
              const SizedBox(width: AppTheme.spacingSm),
              Text('巡检进度', style: AppTheme.titleMedium),
              const Spacer(),
              Text(
                '$_checkedCount/$_totalCount',
                style: AppTheme.numberSmall.copyWith(color: AppTheme.brandBlue),
              ),
            ],
          ),
          const SizedBox(height: AppTheme.spacingMd),
          ClipRRect(
            borderRadius: BorderRadius.circular(AppTheme.radiusSm),
            child: LinearProgressIndicator(
              value: _progress,
              minHeight: 8,
              backgroundColor: AppTheme.backgroundLight,
              valueColor: AlwaysStoppedAnimation<Color>(
                _progress >= 1.0 ? AppTheme.success : AppTheme.brandBlue,
              ),
            ),
          ),
          const SizedBox(height: AppTheme.spacingMd),
          Row(
            children: [
              _countChip('通过', passCount, AppTheme.success),
              const SizedBox(width: AppTheme.spacingSm),
              _countChip('不通过', failCount, AppTheme.error),
              const SizedBox(width: AppTheme.spacingSm),
              _countChip('跳过', skipCount, AppTheme.warning),
            ],
          ),
        ],
      ),
    );
  }

  Widget _countChip(String label, int count, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppTheme.spacingSm,
        vertical: AppTheme.spacingXs,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(AppTheme.radiusSm),
      ),
      child: Text(
        '$label $count',
        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: color),
      ),
    );
  }

  // ── Check item groups ────────────────────────────────────────
  Widget _buildCheckItemGroups() {
    // Group items by groupName
    final Map<String, List<int>> groups = {};
    for (var i = 0; i < _items.length; i++) {
      final group = _items[i].item.groupName;
      groups.putIfAbsent(group, () => []);
      groups[group]!.add(i);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: groups.entries.map((entry) {
        return Padding(
          padding: const EdgeInsets.only(bottom: AppTheme.spacingLg),
          child: _buildGroupSection(entry.key, entry.value),
        );
      }).toList(),
    );
  }

  Widget _buildGroupSection(String groupName, List<int> itemIndices) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.backgroundWhite,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        border: Border.all(color: AppTheme.border, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Group header ──────────────────────────────────
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(
              horizontal: AppTheme.spacingLg,
              vertical: AppTheme.spacingMd,
            ),
            decoration: BoxDecoration(
              color: AppTheme.brandBlue.withValues(alpha: 0.04),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(AppTheme.radiusLg),
                topRight: Radius.circular(AppTheme.radiusLg),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.folder_open_rounded,
                  size: 16,
                  color: AppTheme.brandBlue.withValues(alpha: 0.7),
                ),
                const SizedBox(width: AppTheme.spacingSm),
                Text(
                  groupName,
                  style: AppTheme.titleMedium.copyWith(
                    color: AppTheme.brandBlue,
                    fontSize: 14,
                  ),
                ),
                const Spacer(),
                Text(
                  '${itemIndices.length} 项',
                  style: AppTheme.bodySmall,
                ),
              ],
            ),
          ),
          // ── Items ─────────────────────────────────────────
          ...itemIndices.map((index) => _buildCheckItem(index)),
        ],
      ),
    );
  }

  Widget _buildCheckItem(int index) {
    final state = _items[index];
    final item = state.item;
    final result = state.result;

    return Container(
      padding: const EdgeInsets.all(AppTheme.spacingLg),
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(color: AppTheme.divider, width: 0.5),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Item name ──────────────────────────────────────
          Text(item.name, style: AppTheme.bodyLarge),
          const SizedBox(height: AppTheme.spacingMd),

          // ── Result buttons ─────────────────────────────────
          Row(
            children: [
              _resultButton(
                label: '通过',
                icon: Icons.check_circle_outline_rounded,
                color: AppTheme.success,
                isSelected: result == 'PASS',
                onTap: () => _updateItemResult(index, 'PASS'),
              ),
              const SizedBox(width: AppTheme.spacingSm),
              _resultButton(
                label: '不通过',
                icon: Icons.cancel_outlined,
                color: AppTheme.error,
                isSelected: result == 'FAIL',
                onTap: () => _updateItemResult(index, 'FAIL'),
              ),
              const SizedBox(width: AppTheme.spacingSm),
              _resultButton(
                label: '跳过',
                icon: Icons.skip_next_rounded,
                color: AppTheme.warning,
                isSelected: result == 'SKIP',
                onTap: () => _updateItemResult(index, 'SKIP'),
              ),
              const Spacer(),
              // Camera button
              GestureDetector(
                onTap: () => _pickPhotoForItem(index),
                child: Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: AppTheme.backgroundLight,
                    borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                  ),
                  child: const Icon(
                    Icons.camera_alt_outlined,
                    size: 18,
                    color: AppTheme.textSecondary,
                  ),
                ),
              ),
            ],
          ),

          // ── Note field (shown when FAIL) ───────────────────
          if (result == 'FAIL') ...[
            const SizedBox(height: AppTheme.spacingMd),
            TextField(
              onChanged: (value) => _updateItemNote(index, value),
              maxLines: 2,
              decoration: InputDecoration(
                hintText: '请填写不通过原因...',
                hintStyle: AppTheme.bodySmall.copyWith(color: AppTheme.textHint),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: AppTheme.spacingLg,
                  vertical: AppTheme.spacingMd,
                ),
                filled: true,
                fillColor: AppTheme.backgroundLight,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                  borderSide: BorderSide.none,
                ),
              ),
              style: AppTheme.bodyMedium,
            ),
          ],

          // ── Photo thumbnails ───────────────────────────────
          if (state.photos.isNotEmpty) ...[
            const SizedBox(height: AppTheme.spacingMd),
            SizedBox(
              height: 60,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: state.photos.length,
                separatorBuilder: (_, __) => const SizedBox(width: AppTheme.spacingSm),
                itemBuilder: (context, photoIndex) {
                  final photoPath = state.photos[photoIndex];
                  return ClipRRect(
                    borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                    child: Image.file(
                      File(photoPath),
                      width: 60,
                      height: 60,
                      fit: BoxFit.cover,
                    ),
                  );
                },
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _resultButton({
    required String label,
    required IconData icon,
    required Color color,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AppTheme.spacingMd,
          vertical: AppTheme.spacingSm,
        ),
        decoration: BoxDecoration(
          color: isSelected ? color.withValues(alpha: 0.1) : AppTheme.backgroundLight,
          borderRadius: BorderRadius.circular(AppTheme.radiusMd),
          border: Border.all(
            color: isSelected ? color : Colors.transparent,
            width: 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 16,
              color: isSelected ? color : AppTheme.textSecondary,
            ),
            const SizedBox(width: AppTheme.spacingXs),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                color: isSelected ? color : AppTheme.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Bottom bar ───────────────────────────────────────────────
  Widget _buildBottomBar() {
    if (!_isCheckedIn) return const SizedBox.shrink();

    final isBusy = _isSavingDraft || _isSubmitting;

    return SafeArea(
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AppTheme.spacingLg,
          vertical: AppTheme.spacingMd,
        ),
        decoration: const BoxDecoration(
          color: AppTheme.backgroundWhite,
          border: Border(top: BorderSide(color: AppTheme.border, width: 0.5)),
        ),
        child: Row(
          children: [
            // Draft button
            Expanded(
              child: OutlinedButton(
                onPressed: isBusy ? null : _saveDraft,
                child: _isSavingDraft
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('保存草稿'),
              ),
            ),
            const SizedBox(width: AppTheme.spacingLg),
            // Submit button
            Expanded(
              child: ElevatedButton(
                onPressed: isBusy ? null : _submit,
                child: _isSubmitting
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: AppTheme.textWhite,
                        ),
                      )
                    : const Text('提交巡检'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────
// Check Item State (local mutable state for each item)
// ──────────────────────────────────────────────────────────────

class _CheckItemState {
  final InspectionItem item;
  final String? result;
  final String? note;
  final List<String> photos;

  const _CheckItemState({
    required this.item,
    this.result,
    this.note,
    this.photos = const [],
  });

  _CheckItemState copyWith({
    String? result,
    String? note,
    List<String>? photos,
  }) {
    return _CheckItemState(
      item: item,
      result: result ?? this.result,
      note: note ?? this.note,
      photos: photos ?? this.photos,
    );
  }
}
