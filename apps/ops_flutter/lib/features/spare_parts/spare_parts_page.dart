import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import 'package:ops_flutter/core/theme/app_theme.dart';
import 'package:ops_flutter/shared/widgets/common_widgets.dart';

// ──────────────────────────────────────────────────────────────
// Models
// ──────────────────────────────────────────────────────────────

class SparePart {
  final String id;
  final String name;
  final String model;
  final String category;
  final int stock;
  final int minStock;
  final String unit;
  final String? lastUsedStation;

  const SparePart({
    required this.id,
    required this.name,
    required this.model,
    required this.category,
    required this.stock,
    required this.minStock,
    this.unit = '个',
    this.lastUsedStation,
  });

  bool get isLowStock => stock <= minStock;
}

class ConsumptionRecord {
  final String id;
  final String partName;
  final int quantity;
  final String stationName;
  final String operator;
  final DateTime usedAt;
  final String? remark;

  const ConsumptionRecord({
    required this.id,
    required this.partName,
    required this.quantity,
    required this.stationName,
    required this.operator,
    required this.usedAt,
    this.remark,
  });
}

// ──────────────────────────────────────────────────────────────
// Mock Data
// ──────────────────────────────────────────────────────────────

class SparePartsMockData {
  SparePartsMockData._();

  static final List<SparePart> parts = [
    const SparePart(
      id: 'SP001',
      name: '充电枪头',
      model: 'CCS2-32A',
      category: '充电配件',
      stock: 12,
      minStock: 5,
      unit: '个',
      lastUsedStation: '朝阳公园充电站',
    ),
    const SparePart(
      id: 'SP002',
      name: '急停按钮',
      model: 'EP-100',
      category: '安全配件',
      stock: 3,
      minStock: 5,
      unit: '个',
      lastUsedStation: '中关村充电站',
    ),
    const SparePart(
      id: 'SP003',
      name: 'LCD显示屏',
      model: 'LCD-7TFT',
      category: '显示配件',
      stock: 8,
      minStock: 3,
      unit: '块',
      lastUsedStation: '望京充电站',
    ),
    const SparePart(
      id: 'SP004',
      name: '通信模块',
      model: '4G-LTE-V2',
      category: '通信配件',
      stock: 2,
      minStock: 5,
      unit: '块',
      lastUsedStation: '亦庄充电站',
    ),
    const SparePart(
      id: 'SP005',
      name: '保险丝',
      model: 'Fuse-32A',
      category: '电气配件',
      stock: 45,
      minStock: 20,
      unit: '个',
      lastUsedStation: '国贸充电站',
    ),
    const SparePart(
      id: 'SP006',
      name: '接触器',
      model: 'Contactor-63A',
      category: '电气配件',
      stock: 4,
      minStock: 4,
      unit: '个',
      lastUsedStation: '三里屯充电站',
    ),
    const SparePart(
      id: 'SP007',
      name: '刷卡器',
      model: 'RFID-RC522',
      category: '支付配件',
      stock: 6,
      minStock: 3,
      unit: '个',
      lastUsedStation: '西单充电站',
    ),
    const SparePart(
      id: 'SP008',
      name: '散热风扇',
      model: 'Fan-120mm',
      category: '散热配件',
      stock: 15,
      minStock: 8,
      unit: '个',
      lastUsedStation: '通州充电站',
    ),
    const SparePart(
      id: 'SP009',
      name: '漏电保护器',
      model: 'RCD-30mA',
      category: '安全配件',
      stock: 1,
      minStock: 5,
      unit: '个',
      lastUsedStation: '大兴充电站',
    ),
    const SparePart(
      id: 'SP010',
      name: '电表模块',
      model: 'Meter-3P',
      category: '计量配件',
      stock: 7,
      minStock: 4,
      unit: '块',
      lastUsedStation: '昌平充电站',
    ),
  ];

  static final List<ConsumptionRecord> consumptionHistory = [
    ConsumptionRecord(
      id: 'CR001',
      partName: '充电枪头',
      quantity: 2,
      stationName: '朝阳公园充电站',
      operator: '张伟',
      usedAt: DateTime.now().subtract(const Duration(hours: 3)),
      remark: '枪头卡扣损坏更换',
    ),
    ConsumptionRecord(
      id: 'CR002',
      partName: '急停按钮',
      quantity: 1,
      stationName: '中关村充电站',
      operator: '李明',
      usedAt: DateTime.now().subtract(const Duration(hours: 8)),
      remark: '按钮失灵更换',
    ),
    ConsumptionRecord(
      id: 'CR003',
      partName: '保险丝',
      quantity: 5,
      stationName: '国贸充电站',
      operator: '王强',
      usedAt: DateTime.now().subtract(const Duration(days: 1)),
    ),
    ConsumptionRecord(
      id: 'CR004',
      partName: '通信模块',
      quantity: 1,
      stationName: '亦庄充电站',
      operator: '赵磊',
      usedAt: DateTime.now().subtract(const Duration(days: 2)),
      remark: '模块无法联网',
    ),
    ConsumptionRecord(
      id: 'CR005',
      partName: '散热风扇',
      quantity: 3,
      stationName: '通州充电站',
      operator: '张伟',
      usedAt: DateTime.now().subtract(const Duration(days: 3)),
      remark: '风扇异响',
    ),
  ];

  static const List<String> categories = [
    '全部',
    '充电配件',
    '电气配件',
    '安全配件',
    '通信配件',
    '显示配件',
    '支付配件',
    '散热配件',
    '计量配件',
  ];
}

// ──────────────────────────────────────────────────────────────
// Spare Parts Page
// ──────────────────────────────────────────────────────────────

class SparePartsPage extends StatefulWidget {
  const SparePartsPage({super.key});

  @override
  State<SparePartsPage> createState() => _SparePartsPageState();
}

class _SparePartsPageState extends State<SparePartsPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  static const _tabs = ['库存列表', '消耗记录'];

  // ── Search / Filter state ──────────────────────────────────────
  final TextEditingController _searchController = TextEditingController();
  String _keyword = '';
  String _selectedCategory = '全部';

  // ── Data ──────────────────────────────────────────────────────
  List<SparePart> _filteredParts = [];
  List<ConsumptionRecord> _filteredRecords = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
    _applyFilters();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _applyFilters() {
    final parts = SparePartsMockData.parts.where((p) {
      final matchKeyword = _keyword.isEmpty ||
          p.name.toLowerCase().contains(_keyword.toLowerCase()) ||
          p.model.toLowerCase().contains(_keyword.toLowerCase());
      final matchCategory =
          _selectedCategory == '全部' || p.category == _selectedCategory;
      return matchKeyword && matchCategory;
    }).toList();

    final records = SparePartsMockData.consumptionHistory.where((r) {
      return _keyword.isEmpty ||
          r.partName.toLowerCase().contains(_keyword.toLowerCase()) ||
          r.stationName.toLowerCase().contains(_keyword.toLowerCase());
    }).toList();

    setState(() {
      _filteredParts = parts;
      _filteredRecords = records;
    });
  }

  void _onSearchChanged(String value) {
    _keyword = value.trim();
    _applyFilters();
  }

  void _onCategoryChanged(String category) {
    setState(() {
      _selectedCategory = category;
    });
    _applyFilters();
  }

  // ── Apply request dialog ──────────────────────────────────────
  void _showRequestDialog(SparePart part) {
    final qtyController = TextEditingController(text: '1');
    final reasonController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppTheme.radiusXl)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(
          AppTheme.spacingXl,
          AppTheme.spacingXl,
          AppTheme.spacingXl,
          MediaQuery.of(ctx).viewInsets.bottom + AppTheme.spacingXl,
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Handle bar ────────────────────────────────────
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppTheme.textHint,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: AppTheme.spacingLg),
              Text(
                '申请备件',
                style: AppTheme.titleLarge,
              ),
              const SizedBox(height: AppTheme.spacingSm),
              Text(
                '${part.name} (${part.model})',
                style: AppTheme.bodyMedium.copyWith(color: AppTheme.textSecondary),
              ),
              const SizedBox(height: AppTheme.spacingXl),

              // ── Quantity ──────────────────────────────────────
              Text('申请数量', style: AppTheme.bodyMedium.copyWith(fontWeight: FontWeight.w500)),
              const SizedBox(height: AppTheme.spacingSm),
              TextField(
                controller: qtyController,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  hintText: '请输入数量（库存: ${part.stock} ${part.unit}）',
                  suffixText: part.unit,
                ),
              ),
              const SizedBox(height: AppTheme.spacingLg),

              // ── Reason ────────────────────────────────────────
              Text('申请理由', style: AppTheme.bodyMedium.copyWith(fontWeight: FontWeight.w500)),
              const SizedBox(height: AppTheme.spacingSm),
              TextField(
                controller: reasonController,
                maxLines: 3,
                decoration: const InputDecoration(
                  hintText: '请说明申请理由',
                ),
              ),
              const SizedBox(height: AppTheme.spacingXl),

              // ── Buttons ───────────────────────────────────────
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(ctx),
                      child: const Text('取消'),
                    ),
                  ),
                  const SizedBox(width: AppTheme.spacingMd),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(ctx);
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('备件申请已提交')),
                        );
                      },
                      child: const Text('提交申请'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── Consumption history detail ────────────────────────────────
  void _showConsumptionDetail(ConsumptionRecord record) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppTheme.radiusXl)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(AppTheme.spacingXl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: AppTheme.textHint,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: AppTheme.spacingLg),
            Text('消耗详情', style: AppTheme.titleLarge),
            const SizedBox(height: AppTheme.spacingLg),
            _detailRow('备件名称', record.partName),
            _detailRow('消耗数量', '${record.quantity}'),
            _detailRow('使用站点', record.stationName),
            _detailRow('操作人员', record.operator),
            _detailRow('使用时间', DateFormat('yyyy-MM-dd HH:mm').format(record.usedAt)),
            if (record.remark != null && record.remark!.isNotEmpty)
              _detailRow('备注', record.remark!),
            const SizedBox(height: AppTheme.spacingXl),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('关闭'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _detailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppTheme.spacingSm),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(label, style: AppTheme.bodySmall),
          ),
          Expanded(
            child: Text(value, style: AppTheme.bodyMedium),
          ),
        ],
      ),
    );
  }

  // ── Build ──────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        title: const Text('备件管理'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 20),
          onPressed: () => context.pop(),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: Container(
            color: AppTheme.backgroundWhite,
            child: TabBar(
              controller: _tabController,
              labelColor: AppTheme.brandBlue,
              unselectedLabelColor: AppTheme.textSecondary,
              indicatorColor: AppTheme.brandBlue,
              indicatorWeight: 2,
              indicatorSize: TabBarIndicatorSize.label,
              tabs: _tabs.map((t) => Tab(text: t)).toList(),
            ),
          ),
        ),
      ),
      body: Column(
        children: [
          _buildSearchBar(),
          _buildCategoryFilter(),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildPartsList(),
                _buildConsumptionList(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── Search Bar ─────────────────────────────────────────────────
  Widget _buildSearchBar() {
    return Container(
      padding: const EdgeInsets.fromLTRB(
        AppTheme.spacingLg,
        AppTheme.spacingSm,
        AppTheme.spacingLg,
        0,
      ),
      color: AppTheme.backgroundWhite,
      child: TextField(
        controller: _searchController,
        onChanged: _onSearchChanged,
        style: AppTheme.bodyMedium,
        decoration: InputDecoration(
          hintText: '搜索备件名称、型号',
          hintStyle: AppTheme.bodyMedium.copyWith(color: AppTheme.textHint),
          prefixIcon: const Icon(Icons.search_rounded, color: AppTheme.textHint, size: 20),
          suffixIcon: _searchController.text.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.cancel_rounded, color: AppTheme.textHint, size: 18),
                  onPressed: () {
                    _searchController.clear();
                    _onSearchChanged('');
                  },
                )
              : null,
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
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(AppTheme.radiusMd),
            borderSide: BorderSide.none,
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(AppTheme.radiusMd),
            borderSide: BorderSide.none,
          ),
        ),
      ),
    );
  }

  // ── Category Filter ───────────────────────────────────────────
  Widget _buildCategoryFilter() {
    return Container(
      height: 44,
      color: AppTheme.backgroundWhite,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: AppTheme.spacingLg),
        itemCount: SparePartsMockData.categories.length,
        separatorBuilder: (_, _) => const SizedBox(width: AppTheme.spacingSm),
        itemBuilder: (context, index) {
          final cat = SparePartsMockData.categories[index];
          final isSelected = cat == _selectedCategory;
          return Center(
            child: GestureDetector(
              onTap: () => _onCategoryChanged(cat),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppTheme.spacingMd,
                  vertical: AppTheme.spacingXs,
                ),
                decoration: BoxDecoration(
                  color: isSelected
                      ? AppTheme.brandBlue.withValues(alpha: 0.1)
                      : AppTheme.backgroundLight,
                  borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                  border: isSelected
                      ? Border.all(color: AppTheme.brandBlue, width: 1)
                      : null,
                ),
                child: Text(
                  cat,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                    color: isSelected ? AppTheme.brandBlue : AppTheme.textSecondary,
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  // ── Parts List ─────────────────────────────────────────────────
  Widget _buildPartsList() {
    if (_filteredParts.isEmpty) {
      return const EmptyState(
        icon: Icons.inventory_2_outlined,
        title: '暂无备件',
        subtitle: '当前筛选条件下没有匹配的备件',
      );
    }

    // Summary: count low-stock items
    final lowStockCount = _filteredParts.where((p) => p.isLowStock).length;

    return Column(
      children: [
        // ── Summary banner ──────────────────────────────────────
        if (lowStockCount > 0)
          Container(
            margin: const EdgeInsets.fromLTRB(
              AppTheme.spacingLg,
              AppTheme.spacingMd,
              AppTheme.spacingLg,
              0,
            ),
            padding: const EdgeInsets.symmetric(
              horizontal: AppTheme.spacingMd,
              vertical: AppTheme.spacingSm,
            ),
            decoration: BoxDecoration(
              color: AppTheme.error.withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(AppTheme.radiusMd),
              border: Border.all(color: AppTheme.error.withValues(alpha: 0.2)),
            ),
            child: Row(
              children: [
                const Icon(Icons.warning_amber_rounded, color: AppTheme.error, size: 18),
                const SizedBox(width: AppTheme.spacingSm),
                Text(
                  '$lowStockCount 项备件库存不足，请及时补充',
                  style: AppTheme.bodySmall.copyWith(color: AppTheme.error),
                ),
              ],
            ),
          ),
        // ── Parts list ──────────────────────────────────────────
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(vertical: AppTheme.spacingSm),
            itemCount: _filteredParts.length,
            itemBuilder: (context, index) => _buildPartCard(_filteredParts[index]),
          ),
        ),
      ],
    );
  }

  Widget _buildPartCard(SparePart part) {
    return Container(
      margin: const EdgeInsets.symmetric(
        horizontal: AppTheme.spacingLg,
        vertical: AppTheme.spacingSm,
      ),
      decoration: BoxDecoration(
        color: AppTheme.backgroundWhite,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        border: Border.all(
          color: part.isLowStock ? AppTheme.error.withValues(alpha: 0.3) : AppTheme.border,
          width: part.isLowStock ? 1 : 0.5,
        ),
      ),
      child: IntrinsicHeight(
        child: Row(
          children: [
            // ── Left color bar ──────────────────────────────────
            Container(
              width: 4,
              decoration: BoxDecoration(
                color: part.isLowStock ? AppTheme.error : AppTheme.success,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(AppTheme.radiusLg),
                  bottomLeft: Radius.circular(AppTheme.radiusLg),
                ),
              ),
            ),
            // ── Content ────────────────────────────────────────
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(AppTheme.spacingLg),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ── Row 1: Name + low-stock badge ──────────
                    Row(
                      children: [
                        Expanded(
                          child: Text(part.name, style: AppTheme.titleMedium),
                        ),
                        if (part.isLowStock)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: AppTheme.spacingSm,
                              vertical: AppTheme.spacingXxs,
                            ),
                            decoration: BoxDecoration(
                              color: AppTheme.error.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                            ),
                            child: const Text(
                              '库存不足',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: AppTheme.error,
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: AppTheme.spacingXs),
                    // ── Row 2: Model + Category ─────────────────
                    Row(
                      children: [
                        Icon(Icons.category_outlined, size: 14, color: AppTheme.textSecondary),
                        const SizedBox(width: AppTheme.spacingXs),
                        Text(part.model, style: AppTheme.bodySmall),
                        const SizedBox(width: AppTheme.spacingMd),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: AppTheme.spacingSm,
                            vertical: AppTheme.spacingXxs,
                          ),
                          decoration: BoxDecoration(
                            color: AppTheme.brandBlue.withValues(alpha: 0.06),
                            borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                          ),
                          child: Text(
                            part.category,
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppTheme.brandBlue,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppTheme.spacingSm),
                    // ── Row 3: Stock info ──────────────────────
                    Row(
                      children: [
                        _stockIndicator(part),
                        const Spacer(),
                        if (part.lastUsedStation != null) ...[
                          Icon(Icons.location_on_outlined, size: 12, color: AppTheme.textHint),
                          const SizedBox(width: AppTheme.spacingXxs),
                          Expanded(
                            child: Text(
                              part.lastUsedStation!,
                              style: AppTheme.caption,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: AppTheme.spacingMd),
                    // ── Row 4: Action ──────────────────────────
                    Align(
                      alignment: Alignment.centerRight,
                      child: SizedBox(
                        height: 32,
                        child: OutlinedButton(
                          onPressed: () => _showRequestDialog(part),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            textStyle: const TextStyle(fontSize: 12),
                            side: const BorderSide(color: AppTheme.border),
                            foregroundColor: AppTheme.textSecondary,
                          ),
                          child: const Text('申请备件'),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _stockIndicator(SparePart part) {
    final ratio = part.minStock > 0 ? part.stock / (part.minStock * 2) : 1.0;
    final clampedRatio = ratio.clamp(0.0, 1.0);
    final color = part.isLowStock
        ? AppTheme.error
        : clampedRatio < 0.5
            ? AppTheme.warning
            : AppTheme.success;

    return Row(
      children: [
        // Mini bar chart
        SizedBox(
          width: 60,
          height: 8,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: clampedRatio,
              backgroundColor: AppTheme.divider,
              valueColor: AlwaysStoppedAnimation<Color>(color),
            ),
          ),
        ),
        const SizedBox(width: AppTheme.spacingSm),
        Text(
          '${part.stock} / ${part.minStock}',
          style: AppTheme.numberSmall.copyWith(
            color: color,
            fontSize: 13,
          ),
        ),
        const SizedBox(width: AppTheme.spacingXs),
        Text(
          part.unit,
          style: AppTheme.caption,
        ),
      ],
    );
  }

  // ── Consumption List ──────────────────────────────────────────
  Widget _buildConsumptionList() {
    if (_filteredRecords.isEmpty) {
      return const EmptyState(
        icon: Icons.history_rounded,
        title: '暂无消耗记录',
        subtitle: '当前没有备件消耗记录',
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: AppTheme.spacingSm),
      itemCount: _filteredRecords.length,
      itemBuilder: (context, index) => _buildRecordCard(_filteredRecords[index]),
    );
  }

  Widget _buildRecordCard(ConsumptionRecord record) {
    return GestureDetector(
      onTap: () => _showConsumptionDetail(record),
      child: Container(
        margin: const EdgeInsets.symmetric(
          horizontal: AppTheme.spacingLg,
          vertical: AppTheme.spacingSm,
        ),
        padding: const EdgeInsets.all(AppTheme.spacingLg),
        decoration: BoxDecoration(
          color: AppTheme.backgroundWhite,
          borderRadius: BorderRadius.circular(AppTheme.radiusLg),
          border: Border.all(color: AppTheme.border, width: 0.5),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Row 1: Part name + quantity ──────────────────────
            Row(
              children: [
                Expanded(
                  child: Text(record.partName, style: AppTheme.titleMedium),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppTheme.spacingSm,
                    vertical: AppTheme.spacingXxs,
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.error.withValues(alpha: 0.06),
                    borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                  ),
                  child: Text(
                    '-${record.quantity}',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.error,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppTheme.spacingSm),
            // ── Row 2: Station + Operator ────────────────────────
            Row(
              children: [
                const Icon(Icons.location_on_outlined, size: 14, color: AppTheme.textSecondary),
                const SizedBox(width: AppTheme.spacingXs),
                Expanded(
                  child: Text(record.stationName, style: AppTheme.bodySmall),
                ),
                const Icon(Icons.person_outline_rounded, size: 14, color: AppTheme.textSecondary),
                const SizedBox(width: AppTheme.spacingXs),
                Text(record.operator, style: AppTheme.bodySmall),
              ],
            ),
            const SizedBox(height: AppTheme.spacingXs),
            // ── Row 3: Time + Remark ────────────────────────────
            Row(
              children: [
                const Icon(Icons.access_time_rounded, size: 12, color: AppTheme.textHint),
                const SizedBox(width: AppTheme.spacingXs),
                Text(
                  DateFormat('MM-dd HH:mm').format(record.usedAt),
                  style: AppTheme.caption,
                ),
                if (record.remark != null && record.remark!.isNotEmpty) ...[
                  const SizedBox(width: AppTheme.spacingMd),
                  Expanded(
                    child: Text(
                      record.remark!,
                      style: AppTheme.caption.copyWith(color: AppTheme.textSecondary),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}
