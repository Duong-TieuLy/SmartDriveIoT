import 'package:flutter/material.dart';
import '../models/vehicle.dart';
import '../models/telemetry.dart';
import '../models/control_history.dart';
import '../services/api_service.dart';
import '../services/websocket_service.dart';

class VehicleProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  final WebSocketService _wsService = WebSocketService();

  List<Vehicle> _vehicles = [];
  List<Telemetry> _telemetryLogs = [];
  List<ControlHistory> _controlHistory = [];
  
  // Real-time hardware logs cached by MAC Address
  final Map<String, List<Map<String, String>>> _deviceLogs = {};

  bool _isLoading = false;
  String? _error;
  bool _wsConnected = false;

  List<Vehicle> get vehicles => _vehicles;
  List<Telemetry> get telemetryLogs => _telemetryLogs;
  List<ControlHistory> get controlHistory => _controlHistory;
  Map<String, List<Map<String, String>>> get deviceLogs => _deviceLogs;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get wsConnected => _wsConnected;

  // Initialize and connect WebSocket
  void initWebSocket(int userId) {
    _wsService.onConnected = () {
      _wsConnected = true;
      notifyListeners();
    };

    _wsService.onDisconnected = () {
      _wsConnected = false;
      notifyListeners();
    };

    _wsService.onMessageReceived = (data) {
      final String? type = data['type'];
      final String? macAddress = data['deviceId'];
      
      if (macAddress == null) return;

      switch (type) {
        case 'TELEMETRY':
          final distance = (data['distance'] as num?)?.toDouble();
          final battery = (data['battery'] as num?)?.toInt();
          
          _vehicles = _vehicles.map((v) {
            if (v.id == macAddress) {
              return v.copyWith(
                realtimeDistance: distance ?? v.realtimeDistance,
                battery: battery ?? v.battery,
              );
            }
            return v;
          }).toList();
          notifyListeners();
          break;

        case 'STATUS_CHANGE':
          final connStatus = data['connectionStatus'] as String? ?? 'OFFLINE';
          _vehicles = _vehicles.map((v) {
            if (v.id == macAddress) {
              return v.copyWith(
                connectionStatus: connStatus,
                status: connStatus == 'ONLINE' ? 'online' : 'offline',
              );
            }
            return v;
          }).toList();
          notifyListeners();
          break;

        case 'DEVICE_LOG':
          final message = data['message'] as String? ?? '';
          final timestamp = DateTime.now().toLocal().toString().split(' ')[1].substring(0, 8);
          
          if (!_deviceLogs.containsKey(macAddress)) {
            _deviceLogs[macAddress] = [];
          }
          
          _deviceLogs[macAddress]!.add({
            'timestamp': timestamp,
            'text': message,
          });

          // Restrict to last 50 lines to prevent memory bloating
          if (_deviceLogs[macAddress]!.length > 50) {
            _deviceLogs[macAddress]!.removeAt(0);
          }
          notifyListeners();
          break;
          
        default:
          break;
      }
    };

    _wsService.connect(userId);
  }

  // Closes WS session
  void closeWebSocket() {
    _wsService.disconnect();
    _wsConnected = false;
  }

  // Trigger manual steering movements
  void sendVehicleCommand(String macAddress, String command) {
    _wsService.sendCommand(macAddress, command);
  }

  // Clear states (called on logout)
  void clearState() {
    closeWebSocket();
    _vehicles = [];
    _telemetryLogs = [];
    _controlHistory = [];
    _deviceLogs.clear();
    _error = null;
  }

  // API operations
  Future<void> fetchCombinedVehicles(int userId, String token) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // Load both lists concurrently to improve startup response
      final results = await Future.wait([
        _apiService.getMyDevices(userId, token),
        _apiService.getSharedDevices(userId, token),
      ]);

      final myDevices = results[0];
      final sharedDevices = results[1];

      // Merge by MAC Address (preventing duplicate keys)
      final Map<String, Vehicle> combinedMap = {};
      for (var d in myDevices) {
        combinedMap[d.id] = d;
      }
      for (var d in sharedDevices) {
        combinedMap[d.id] = d;
      }

      _vehicles = combinedMap.values.toList();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> addVehicle(String name, String macAddress, int userId, String token) async {
    _isLoading = true;
    notifyListeners();
    try {
      final newVehicle = await _apiService.registerDevice(name.trim(), macAddress.trim(), userId, token);
      _vehicles.add(newVehicle);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> shareVehicle(int deviceId, int userId, String driverEmail, String token) async {
    _isLoading = true;
    notifyListeners();
    try {
      await _apiService.shareDevice(deviceId, userId, driverEmail.trim(), token);
      // Reload lists to fetch updated relations
      await fetchCombinedVehicles(userId, token);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> deleteVehicle(int deviceId, int userId, String token) async {
    _isLoading = true;
    notifyListeners();
    try {
      await _apiService.deleteDevice(deviceId, userId, token);
      _vehicles.removeWhere((v) => v.dbId == deviceId);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchTelemetry(int deviceId, String token) async {
    try {
      _telemetryLogs = await _apiService.getDeviceTelemetry(deviceId, token);
      notifyListeners();
    } catch (e) {
      debugPrint('Error fetching telemetry: $e');
    }
  }

  Future<Map<String, dynamic>> fetchControlHistory(String macAddress, int page, int size, String token) async {
    try {
      final data = await _apiService.getControlHistory(macAddress, page, size, token);
      _controlHistory = data['content'] as List<ControlHistory>;
      notifyListeners();
      return data;
    } catch (e) {
      debugPrint('Error fetching control history: $e');
      rethrow;
    }
  }
}
