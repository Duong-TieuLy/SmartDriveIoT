class Vehicle {
  final String id; // This is the MAC Address
  final int dbId;  // This is the Database ID
  final String name;
  final String plate;
  final String location;
  final int battery;
  final String condition;
  final String status; // 'online' or 'offline'
  final String connectionStatus; // 'ONLINE' or 'OFFLINE'
  final int ownerId;
  final List<int> sharedDrivers;
  
  // Realtime state parameters updated via WebSocket
  final double? realtimeDistance;

  Vehicle({
    required this.id,
    required this.dbId,
    required this.name,
    this.plate = 'IoT-CAR',
    this.location = 'Khu thử nghiệm',
    this.battery = 100,
    this.condition = 'good',
    required this.status,
    required this.connectionStatus,
    required this.ownerId,
    required this.sharedDrivers,
    this.realtimeDistance,
  });

  factory Vehicle.fromJson(Map<String, dynamic> json) {
    final statusString = (json['status'] as String? ?? 'OFFLINE').toUpperCase();
    final isOnline = statusString == 'ONLINE';
    
    return Vehicle(
      id: json['macAddress'] as String? ?? '',
      dbId: json['id'] as int? ?? 0,
      name: json['name'] as String? ?? 'Unnamed Car',
      plate: json['plate'] as String? ?? 'IoT-CAR',
      location: json['location'] as String? ?? 'Khu thử nghiệm',
      battery: json['battery'] as int? ?? 100,
      condition: json['condition'] as String? ?? 'good',
      status: isOnline ? 'online' : 'offline',
      connectionStatus: statusString,
      ownerId: json['ownerId'] as int? ?? 0,
      sharedDrivers: json['driverIds'] != null
          ? List<int>.from(json['driverIds'] as List)
          : [],
    );
  }

  Vehicle copyWith({
    String? id,
    int? dbId,
    String? name,
    String? plate,
    String? location,
    int? battery,
    String? condition,
    String? status,
    String? connectionStatus,
    int? ownerId,
    List<int>? sharedDrivers,
    double? realtimeDistance,
  }) {
    return Vehicle(
      id: id ?? this.id,
      dbId: dbId ?? this.dbId,
      name: name ?? this.name,
      plate: plate ?? this.plate,
      location: location ?? this.location,
      battery: battery ?? this.battery,
      condition: condition ?? this.condition,
      status: status ?? this.status,
      connectionStatus: connectionStatus ?? this.connectionStatus,
      ownerId: ownerId ?? this.ownerId,
      sharedDrivers: sharedDrivers ?? this.sharedDrivers,
      realtimeDistance: realtimeDistance ?? this.realtimeDistance,
    );
  }
}
