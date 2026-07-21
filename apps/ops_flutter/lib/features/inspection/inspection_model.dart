/// Inspection data model aligned with backend InspectionTaskVO.
class InspectionTask {
  final String id;
  final String name;
  final String stationName;
  final String status;
  final int deviceCount;
  final int itemCount;
  final String? inspector;
  final DateTime? planTime;
  final DateTime? startTime;
  final DateTime? completeTime;

  const InspectionTask({
    required this.id,
    required this.name,
    required this.stationName,
    required this.status,
    this.deviceCount = 0,
    this.itemCount = 0,
    this.inspector,
    this.planTime,
    this.startTime,
    this.completeTime,
  });

  factory InspectionTask.fromJson(Map<String, dynamic> json) {
    return InspectionTask(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      stationName: json['stationName']?.toString() ?? '',
      status: json['status']?.toString() ?? 'PENDING',
      deviceCount: json['deviceCount'] as int? ?? 0,
      itemCount: json['itemCount'] as int? ?? 0,
      inspector: json['inspector']?.toString(),
      planTime: json['planTime'] != null
          ? DateTime.tryParse(json['planTime'].toString())
          : null,
      startTime: json['startTime'] != null
          ? DateTime.tryParse(json['startTime'].toString())
          : null,
      completeTime: json['completeTime'] != null
          ? DateTime.tryParse(json['completeTime'].toString())
          : null,
    );
  }

  /// Inspection progress ratio (0.0 ~ 1.0).
  double get progress => itemCount > 0 ? deviceCount / itemCount : 0.0;

  bool get isPending => status.toUpperCase() == 'PENDING';
  bool get isInProgress => status.toUpperCase() == 'IN_PROGRESS';
  bool get isCompleted => status.toUpperCase() == 'COMPLETED';
}

/// A single inspection check item.
class InspectionItem {
  final String id;
  final String name;
  final String groupName;
  final String? result; // PASS / FAIL / SKIP
  final String? note;
  final List<String> photos;

  const InspectionItem({
    required this.id,
    required this.name,
    required this.groupName,
    this.result,
    this.note,
    this.photos = const [],
  });

  factory InspectionItem.fromJson(Map<String, dynamic> json) {
    return InspectionItem(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      groupName: json['groupName']?.toString() ?? '',
      result: json['result']?.toString(),
      note: json['note']?.toString(),
      photos: (json['photos'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
    );
  }

  InspectionItem copyWith({
    String? result,
    String? note,
    List<String>? photos,
  }) {
    return InspectionItem(
      id: id,
      name: name,
      groupName: groupName,
      result: result ?? this.result,
      note: note ?? this.note,
      photos: photos ?? this.photos,
    );
  }
}

/// Inspection report data.
class InspectionReport {
  final String inspectionId;
  final String name;
  final String stationName;
  final String? inspector;
  final DateTime? startTime;
  final DateTime? completeTime;
  final int totalItems;
  final int passedItems;
  final int failedItems;
  final int skippedItems;
  final List<InspectionItem> anomalies;
  final List<InspectionItem> allItems;

  const InspectionReport({
    required this.inspectionId,
    required this.name,
    required this.stationName,
    this.inspector,
    this.startTime,
    this.completeTime,
    this.totalItems = 0,
    this.passedItems = 0,
    this.failedItems = 0,
    this.skippedItems = 0,
    this.anomalies = const [],
    this.allItems = const [],
  });

  factory InspectionReport.fromJson(Map<String, dynamic> json) {
    return InspectionReport(
      inspectionId: json['inspectionId']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      stationName: json['stationName']?.toString() ?? '',
      inspector: json['inspector']?.toString(),
      startTime: json['startTime'] != null ? DateTime.tryParse(json['startTime'].toString()) : null,
      completeTime: json['completeTime'] != null ? DateTime.tryParse(json['completeTime'].toString()) : null,
      totalItems: json['totalItems'] as int? ?? 0,
      passedItems: json['passedItems'] as int? ?? 0,
      failedItems: json['failedItems'] as int? ?? 0,
      skippedItems: json['skippedItems'] as int? ?? 0,
      anomalies: (json['anomalies'] as List<dynamic>?)
              ?.map((e) => InspectionItem.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      allItems: (json['allItems'] as List<dynamic>?)
              ?.map((e) => InspectionItem.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}
