/// Extended alert model aligned with backend AlertVO.
class AlertRecord {
  final String id;
  final String title;
  final String level; // P0, P1, P2, P3
  final String status; // pending, processing, resolved, ignored
  final String deviceCode;
  final String stationName;
  final String? description;
  final DateTime createdAt;
  final String? handler;
  final String? handleResult;
  final DateTime? handleTime;

  const AlertRecord({
    required this.id,
    required this.title,
    required this.level,
    required this.status,
    required this.deviceCode,
    required this.stationName,
    this.description,
    required this.createdAt,
    this.handler,
    this.handleResult,
    this.handleTime,
  });

  factory AlertRecord.fromJson(Map<String, dynamic> json) {
    return AlertRecord(
      id: json['id']?.toString() ?? '',
      title: json['title'] as String? ?? '',
      level: json['level'] as String? ?? 'P3',
      status: json['status'] as String? ?? 'pending',
      deviceCode: json['deviceCode'] as String? ?? '',
      stationName: json['stationName'] as String? ?? '',
      description: json['description'] as String?,
      createdAt: json['createTime'] != null
          ? DateTime.tryParse(json['createTime'] as String) ?? DateTime.now()
          : DateTime.now(),
      handler: json['handler'] as String?,
      handleResult: json['handleResult'] as String?,
      handleTime: json['handleTime'] != null
          ? DateTime.tryParse(json['handleTime'] as String)
          : null,
    );
  }

  /// Whether this alert can still be processed.
  bool get isPending => status == 'pending' || status == 'processing';
}

/// Alert detail with device snapshot, timeline, and processing history.
class AlertDetail {
  final AlertRecord alert;
  final Map<String, String> deviceSnapshot; // device info key-value pairs
  final List<AlertTimelineEvent> timeline;
  final List<AlertProcessRecord> processRecords;

  const AlertDetail({
    required this.alert,
    required this.deviceSnapshot,
    required this.timeline,
    required this.processRecords,
  });

  factory AlertDetail.fromJson(Map<String, dynamic> json) {
    final alertData = json['alert'] as Map<String, dynamic>? ?? json;

    final snapshotMap = <String, String>{};
    final rawSnapshot = json['deviceSnapshot'] as Map<String, dynamic>?;
    if (rawSnapshot != null) {
      rawSnapshot.forEach((key, value) {
        snapshotMap[key] = value?.toString() ?? '-';
      });
    }

    final timelineList = (json['timeline'] as List<dynamic>?)
            ?.map((e) => AlertTimelineEvent.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];

    final processList = (json['processRecords'] as List<dynamic>?)
            ?.map((e) => AlertProcessRecord.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];

    return AlertDetail(
      alert: AlertRecord.fromJson(alertData),
      deviceSnapshot: snapshotMap,
      timeline: timelineList,
      processRecords: processList,
    );
  }
}

/// A single event in the 24h timeline.
class AlertTimelineEvent {
  final DateTime time;
  final String title;
  final String? detail;
  final String type; // alert, status_change, process

  const AlertTimelineEvent({
    required this.time,
    required this.title,
    this.detail,
    required this.type,
  });

  factory AlertTimelineEvent.fromJson(Map<String, dynamic> json) {
    return AlertTimelineEvent(
      time: json['time'] != null
          ? DateTime.tryParse(json['time'] as String) ?? DateTime.now()
          : DateTime.now(),
      title: json['title'] as String? ?? '',
      detail: json['detail'] as String?,
      type: json['type'] as String? ?? 'status_change',
    );
  }
}

/// A processing record added by an operator.
class AlertProcessRecord {
  final int id;
  final String operatorName;
  final String action; // acknowledged, resolved, dispatched, note
  final String? remark;
  final DateTime createdAt;

  const AlertProcessRecord({
    required this.id,
    required this.operatorName,
    required this.action,
    this.remark,
    required this.createdAt,
  });

  factory AlertProcessRecord.fromJson(Map<String, dynamic> json) {
    return AlertProcessRecord(
      id: json['id'] as int? ?? 0,
      operatorName: json['operatorName'] as String? ?? '',
      action: json['action'] as String? ?? '',
      remark: json['remark'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

/// Alert statistics overview.
class AlertStats {
  final int totalAlerts;
  final int resolvedAlerts;
  final int pendingAlerts;
  final double resolveRate;
  final double avgResponseMinutes;
  final double avgResolveMinutes;
  final List<AlertTrendPoint> trend; // 7-day trend
  final List<AlertTypeDistribution> typeDistribution;

  const AlertStats({
    required this.totalAlerts,
    required this.resolvedAlerts,
    required this.pendingAlerts,
    required this.resolveRate,
    required this.avgResponseMinutes,
    required this.avgResolveMinutes,
    required this.trend,
    required this.typeDistribution,
  });

  factory AlertStats.fromJson(Map<String, dynamic> json) {
    final trendList = (json['trend'] as List<dynamic>?)
            ?.map((e) => AlertTrendPoint.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];

    final typeList = (json['typeDistribution'] as List<dynamic>?)
            ?.map((e) =>
                AlertTypeDistribution.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];

    return AlertStats(
      totalAlerts: json['totalAlerts'] as int? ?? 0,
      resolvedAlerts: json['resolvedAlerts'] as int? ?? 0,
      pendingAlerts: json['pendingAlerts'] as int? ?? 0,
      resolveRate: (json['resolveRate'] as num?)?.toDouble() ?? 0,
      avgResponseMinutes:
          (json['avgResponseMinutes'] as num?)?.toDouble() ?? 0,
      avgResolveMinutes:
          (json['avgResolveMinutes'] as num?)?.toDouble() ?? 0,
      trend: trendList,
      typeDistribution: typeList,
    );
  }
}

/// A single data point for the 7-day trend chart.
class AlertTrendPoint {
  final String date; // e.g. "07-14"
  final int count;

  const AlertTrendPoint({required this.date, required this.count});

  factory AlertTrendPoint.fromJson(Map<String, dynamic> json) {
    return AlertTrendPoint(
      date: json['date'] as String? ?? '',
      count: json['count'] as int? ?? 0,
    );
  }
}

/// A single entry in the type distribution pie chart.
class AlertTypeDistribution {
  final String level; // P0, P1, P2, P3
  final int count;

  const AlertTypeDistribution({required this.level, required this.count});

  factory AlertTypeDistribution.fromJson(Map<String, dynamic> json) {
    return AlertTypeDistribution(
      level: json['level'] as String? ?? 'P3',
      count: json['count'] as int? ?? 0,
    );
  }
}
