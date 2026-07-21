/// Recent alert item displayed on the dashboard.
class AlertItem {
  final int id;
  final String title;
  final String level; // P0, P1, P2, P3
  final String deviceName;
  final String stationName;
  final DateTime createdAt;

  const AlertItem({
    required this.id,
    required this.title,
    required this.level,
    required this.deviceName,
    required this.stationName,
    required this.createdAt,
  });

  factory AlertItem.fromJson(Map<String, dynamic> json) {
    return AlertItem(
      id: json['id'] as int? ?? 0,
      title: json['title'] as String? ?? '',
      level: json['level'] as String? ?? 'P3',
      deviceName: json['deviceName'] as String? ?? '',
      stationName: json['stationName'] as String? ?? '',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  @override
  String toString() => 'AlertItem(id: $id, title: $title, level: $level)';
}
