class ControlHistory {
  final int id;
  final String command;
  final String status;
  final DateTime timestamp;
  final String macAddress;
  final int? userId;

  ControlHistory({
    required this.id,
    required this.command,
    required this.status,
    required this.timestamp,
    required this.macAddress,
    this.userId,
  });

  factory ControlHistory.fromJson(Map<String, dynamic> json) {
    return ControlHistory(
      id: json['id'] as int? ?? 0,
      command: json['command'] as String? ?? 'UNKNOWN',
      status: json['status'] as String? ?? 'SENT',
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'] as String)
          : DateTime.now(),
      macAddress: json['macAddress'] as String? ?? '',
      userId: json['userId'] as int?,
    );
  }
}
