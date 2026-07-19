import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants.dart';
import '../models/user.dart';
import '../models/vehicle.dart';
import '../models/telemetry.dart';
import '../models/control_history.dart';

class ApiService {
  // Retrieve the dynamically set HTTP base URL
  static Future<String> getBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    String host = prefs.getString(AppConstants.serverHostKey) ?? AppConstants.defaultServerHost;
    // Clean trailing slashes or protocols if specified
    host = host.trim();
    if (!host.startsWith('http://') && !host.startsWith('https://')) {
      host = 'http://$host';
    }
    if (host.endsWith('/')) {
      host = host.substring(0, host.length - 1);
    }
    return host;
  }

  // Get WebSocket base URL
  static Future<String> getWebSocketUrl() async {
    final prefs = await SharedPreferences.getInstance();
    String host = prefs.getString(AppConstants.serverHostKey) ?? AppConstants.defaultServerHost;
    host = host.trim();
    final bool isSecure = host.startsWith('https://');
    host = host.replaceAll('http://', '').replaceAll('https://', '');
    if (host.endsWith('/')) {
      host = host.substring(0, host.length - 1);
    }
    return isSecure ? 'wss://$host' : 'ws://$host';
  }

  // Construct request headers
  static Map<String, String> _headers(String? token) {
    return {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'any-value-here',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // POST /api/auth/login
  Future<String> login(String email, String password) async {
    final baseUrl = await getBaseUrl();
    final url = Uri.parse('$baseUrl/api/auth/login');
    
    final response = await http.post(
      url,
      headers: _headers(null),
      body: json.encode({'email': email, 'password': password}),
    );

    if (response.statusCode == 200) {
      final body = response.body;
      try {
        // Try parsing JSON if backend returned an object (e.g. { "token": "..." })
        final data = json.decode(body) as Map<String, dynamic>;
        return (data['token'] ?? data['accessToken'] ?? body) as String;
      } catch (_) {
        // Otherwise, return raw body text
        return body;
      }
    } else {
      try {
        final errorData = json.decode(response.body) as Map<String, dynamic>;
        throw errorData['message'] ?? 'Email hoặc mật khẩu không chính xác.';
      } catch (_) {
        throw 'Đăng nhập thất bại. Mã lỗi: ${response.statusCode}';
      }
    }
  }

  // POST /api/auth/register
  Future<String> register(String fullName, String email, String password) async {
    final baseUrl = await getBaseUrl();
    final url = Uri.parse('$baseUrl/api/auth/register');

    final response = await http.post(
      url,
      headers: _headers(null),
      body: json.encode({'fullName': fullName, 'email': email, 'password': password}),
    );

    final body = response.body;
    if (response.statusCode == 200) {
      try {
        final data = json.decode(body) as Map<String, dynamic>;
        return (data['message'] ?? body) as String;
      } catch (_) {
        return body;
      }
    } else {
      try {
        final errorData = json.decode(body) as Map<String, dynamic>;
        throw errorData['message'] ?? 'Đăng ký thất bại.';
      } catch (_) {
        throw body.isNotEmpty ? body : 'Đăng ký thất bại.';
      }
    }
  }

  // GET /api/devices/my-devices/{userId}
  Future<List<Vehicle>> getMyDevices(int userId, String token) async {
    final baseUrl = await getBaseUrl();
    final url = Uri.parse('$baseUrl/api/devices/my-devices/$userId');

    final response = await http.get(url, headers: _headers(token));
    if (response.statusCode == 200) {
      final List data = json.decode(response.body) as List;
      return data.map((json) => Vehicle.fromJson(json as Map<String, dynamic>)).toList();
    } else {
      throw 'Không thể tải danh sách xe của bạn.';
    }
  }

  // GET /api/devices/shared-with-me/{driverId}
  Future<List<Vehicle>> getSharedDevices(int driverId, String token) async {
    final baseUrl = await getBaseUrl();
    final url = Uri.parse('$baseUrl/api/devices/shared-with-me/$driverId');

    final response = await http.get(url, headers: _headers(token));
    if (response.statusCode == 200) {
      final List data = json.decode(response.body) as List;
      return data.map((json) => Vehicle.fromJson(json as Map<String, dynamic>)).toList();
    } else {
      throw 'Không thể tải danh sách xe được chia sẻ.';
    }
  }

  // POST /api/devices/register/{userId}
  Future<Vehicle> registerDevice(String name, String macAddress, int userId, String token) async {
    final baseUrl = await getBaseUrl();
    final url = Uri.parse('$baseUrl/api/devices/register/$userId');

    final response = await http.post(
      url,
      headers: _headers(token),
      body: json.encode({'name': name, 'macAddress': macAddress}),
    );

    if (response.statusCode == 200) {
      return Vehicle.fromJson(json.decode(response.body) as Map<String, dynamic>);
    } else {
      throw 'Đăng ký thiết bị thất bại.';
    }
  }

  // POST /api/devices/{deviceId}/share/{userId}
  Future<String> shareDevice(int deviceId, int userId, String driverEmail, String token) async {
    final baseUrl = await getBaseUrl();
    final url = Uri.parse('$baseUrl/api/devices/$deviceId/share/$userId');

    final response = await http.post(
      url,
      headers: _headers(token),
      body: json.encode({'driverEmail': driverEmail}),
    );

    if (response.statusCode == 200) {
      return response.body;
    } else {
      throw 'Chia sẻ thiết bị thất bại.';
    }
  }

  // DELETE /api/devices/{deviceId}/owner/{userId}
  Future<void> deleteDevice(int deviceId, int userId, String token) async {
    final baseUrl = await getBaseUrl();
    final url = Uri.parse('$baseUrl/api/devices/$deviceId/owner/$userId');

    final response = await http.delete(url, headers: _headers(token));
    if (response.statusCode != 200) {
      throw 'Xóa thiết bị thất bại.';
    }
  }

  // GET /api/devices/{deviceId}/telemetry
  Future<List<Telemetry>> getDeviceTelemetry(int deviceId, String token) async {
    final baseUrl = await getBaseUrl();
    final url = Uri.parse('$baseUrl/api/devices/$deviceId/telemetry');

    final response = await http.get(url, headers: _headers(token));
    if (response.statusCode == 200) {
      final List data = json.decode(response.body) as List;
      return data.map((json) => Telemetry.fromJson(json as Map<String, dynamic>)).toList();
    } else {
      throw 'Không thể tải lịch sử telemetry.';
    }
  }

  // GET /api/control/history/{macAddress}?page={page}&size={size}
  Future<Map<String, dynamic>> getControlHistory(String macAddress, int page, int size, String token) async {
    final baseUrl = await getBaseUrl();
    final url = Uri.parse('$baseUrl/api/control/history/$macAddress?page=$page&size=$size');

    final response = await http.get(url, headers: _headers(token));
    if (response.statusCode == 200) {
      final Map<String, dynamic> data = json.decode(response.body) as Map<String, dynamic>;
      final List content = data['content'] as List;
      return {
        'content': content.map((json) => ControlHistory.fromJson(json as Map<String, dynamic>)).toList(),
        'currentPage': data['currentPage'] as int,
        'totalPages': data['totalPages'] as int,
        'totalItems': data['totalItems'] as int,
      };
    } else {
      throw 'Không thể tải lịch sử điều khiển.';
    }
  }

  // PUT /api/users/{id}/change-password
  Future<void> changePassword(int userId, String oldPassword, String newPassword, String token) async {
    final baseUrl = await getBaseUrl();
    final url = Uri.parse('$baseUrl/api/users/$userId/change-password');

    final response = await http.put(
      url,
      headers: _headers(token),
      body: json.encode({'oldPassword': oldPassword, 'newPassword': newPassword}),
    );

    if (response.statusCode != 200) {
      throw response.body.isNotEmpty ? response.body : 'Đổi mật khẩu thất bại.';
    }
  }

  // GET /api/users (Admin ONLY)
  Future<List<User>> getAllUsers(String token) async {
    final baseUrl = await getBaseUrl();
    final url = Uri.parse('$baseUrl/api/users');

    final response = await http.get(url, headers: _headers(token));
    if (response.statusCode == 200) {
      final List data = json.decode(response.body) as List;
      return data.map((json) => User.fromJson(json as Map<String, dynamic>)).toList();
    } else {
      throw 'Không thể tải danh sách người dùng.';
    }
  }

  // DELETE /api/users/{id} (Admin ONLY)
  Future<void> deleteUser(int userId, String token) async {
    final baseUrl = await getBaseUrl();
    final url = Uri.parse('$baseUrl/api/users/$userId');

    final response = await http.delete(url, headers: _headers(token));
    if (response.statusCode != 200) {
      throw 'Xóa tài khoản thất bại.';
    }
  }
}
