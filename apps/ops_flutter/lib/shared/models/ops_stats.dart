/// Ops dashboard statistics aligned with backend DashboardStatsVO.
class OpsStats {
  final int stationCount;
  final int deviceCount;
  final int onlineDeviceCount;
  final int todayOrderCount;
  final int todayRevenue; // in fen (分)
  final int monthRevenue;
  final int totalEnergy; // in Wh
  final int todayEnergy;

  const OpsStats({
    this.stationCount = 0,
    this.deviceCount = 0,
    this.onlineDeviceCount = 0,
    this.todayOrderCount = 0,
    this.todayRevenue = 0,
    this.monthRevenue = 0,
    this.totalEnergy = 0,
    this.todayEnergy = 0,
  });

  factory OpsStats.fromJson(Map<String, dynamic> json) {
    return OpsStats(
      stationCount: json['stationCount'] as int? ?? 0,
      deviceCount: json['deviceCount'] as int? ?? 0,
      onlineDeviceCount: json['onlineDeviceCount'] as int? ?? 0,
      todayOrderCount: json['todayOrderCount'] as int? ?? 0,
      todayRevenue: json['todayRevenue'] as int? ?? 0,
      monthRevenue: json['monthRevenue'] as int? ?? 0,
      totalEnergy: json['totalEnergy'] as int? ?? 0,
      todayEnergy: json['todayEnergy'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'stationCount': stationCount,
      'deviceCount': deviceCount,
      'onlineDeviceCount': onlineDeviceCount,
      'todayOrderCount': todayOrderCount,
      'todayRevenue': todayRevenue,
      'monthRevenue': monthRevenue,
      'totalEnergy': totalEnergy,
      'todayEnergy': todayEnergy,
    };
  }

  @override
  String toString() =>
      'OpsStats(stations: $stationCount, devices: $deviceCount/$onlineDeviceCount, '
      'orders: $todayOrderCount, revenue: $todayRevenue)';
}
