/// Work order data model aligned with backend WorkOrderVO.
class WorkOrder {
  final String id;
  final String orderNo;
  final String title;
  final String type;
  final String priority;
  final String status;
  final String stationName;
  final String deviceCode;
  final String? description;
  final String? creator;
  final String? assignee;
  final String? result;
  final DateTime createdAt;
  final DateTime? acceptTime;
  final DateTime? completeTime;

  const WorkOrder({
    required this.id,
    required this.orderNo,
    required this.title,
    required this.type,
    required this.priority,
    required this.status,
    required this.stationName,
    this.deviceCode = '',
    this.description,
    this.creator,
    this.assignee,
    this.result,
    required this.createdAt,
    this.acceptTime,
    this.completeTime,
  });

  factory WorkOrder.fromJson(Map<String, dynamic> json) {
    return WorkOrder(
      id: json['id']?.toString() ?? '',
      orderNo: json['orderNo']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      type: json['type']?.toString() ?? '',
      priority: json['priority']?.toString() ?? 'MEDIUM',
      status: json['status']?.toString() ?? 'PENDING',
      stationName: json['stationName']?.toString() ?? '',
      deviceCode: json['deviceCode']?.toString() ?? '',
      description: json['description']?.toString(),
      creator: json['creator']?.toString(),
      assignee: json['assignee']?.toString(),
      result: json['result']?.toString(),
      createdAt: DateTime.tryParse(json['createTime']?.toString() ?? '') ?? DateTime.now(),
      acceptTime: json['acceptTime'] != null
          ? DateTime.tryParse(json['acceptTime'].toString())
          : null,
      completeTime: json['completeTime'] != null
          ? DateTime.tryParse(json['completeTime'].toString())
          : null,
    );
  }

  /// Whether the order is in a pending state.
  bool get isPending => status.toUpperCase() == 'PENDING';

  /// Whether the order has been completed.
  bool get isCompleted =>
      status.toUpperCase() == 'COMPLETED' || status.toUpperCase() == 'CLOSED';
}

/// A single timeline entry in a work order.
class WorkOrderTimeline {
  final String id;
  final String action;
  final String? operatorName;
  final String? remark;
  final DateTime createdAt;

  const WorkOrderTimeline({
    required this.id,
    required this.action,
    this.operatorName,
    this.remark,
    required this.createdAt,
  });

  factory WorkOrderTimeline.fromJson(Map<String, dynamic> json) {
    return WorkOrderTimeline(
      id: json['id']?.toString() ?? '',
      action: json['action']?.toString() ?? '',
      operatorName: json['operatorName']?.toString(),
      remark: json['remark']?.toString(),
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
    );
  }
}

/// Spare part consumed during work order processing.
class SparePartItem {
  final String id;
  final String name;
  final int quantity;
  final String? unit;

  const SparePartItem({
    required this.id,
    required this.name,
    required this.quantity,
    this.unit,
  });

  factory SparePartItem.fromJson(Map<String, dynamic> json) {
    return SparePartItem(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      quantity: json['quantity'] as int? ?? 0,
      unit: json['unit']?.toString(),
    );
  }
}
