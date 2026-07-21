/// Station data model aligned with backend StationVO.
class Station {
  final String id;
  final String name;
  final String address;
  final int deviceCount;
  final int onlineDeviceCount;
  final int totalPorts;
  final int availablePorts;
  final String status;
  final double? distance;

  const Station({
    required this.id,
    required this.name,
    required this.address,
    required this.deviceCount,
    required this.onlineDeviceCount,
    this.totalPorts = 0,
    this.availablePorts = 0,
    required this.status,
    this.distance,
  });

  factory Station.fromJson(Map<String, dynamic> json) {
    return Station(
      id: json['id']?.toString() ?? '',
      name: json['name'] as String? ?? '',
      address: json['address'] as String? ?? '',
      deviceCount: json['deviceCount'] as int? ?? 0,
      onlineDeviceCount: json['onlineDeviceCount'] as int? ?? 0,
      totalPorts: json['totalPorts'] as int? ?? 0,
      availablePorts: json['availablePorts'] as int? ?? 0,
      status: json['status'] as String? ?? 'OFFLINE',
      distance: (json['distance'] as num?)?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'address': address,
      'deviceCount': deviceCount,
      'onlineDeviceCount': onlineDeviceCount,
      'totalPorts': totalPorts,
      'availablePorts': availablePorts,
      'status': status,
      'distance': distance,
    };
  }

  bool get isOnline => status.toUpperCase() == 'ONLINE';
}
