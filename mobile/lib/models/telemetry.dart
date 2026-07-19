class Telemetry {
  final int id;
  final int deviceId;
  final double distanceCm;
  final DateTime timestamp;

  Telemetry({
    required this.id,
    required this.deviceId,
    required this.distanceCm,
    required this.timestamp,
  });

  factory Telemetry.fromJson(Map<String, dynamic> json) {
    return Telemetry(
      id: json['id'] as int? ?? 0,
      deviceId: json['deviceId'] as int? ?? 0,
      distanceCm: (json['distanceCm'] as num? ?? 0.0).toDouble(),
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'] as String)
          : DateTime.now(),
    );
  }
}
