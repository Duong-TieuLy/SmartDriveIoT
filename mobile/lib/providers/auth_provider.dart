import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants.dart';
import '../models/user.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  String? _token;
  User? _currentUser;
  bool _isLoading = false;
  String _serverHost = AppConstants.defaultServerHost;

  String? get token => _token;
  User? get currentUser => _currentUser;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _token != null && _currentUser != null;
  String get serverHost => _serverHost;

  AuthProvider() {
    _loadSession();
  }

  // Restore session tokens and custom API hosts on startup
  Future<void> _loadSession() async {
    final prefs = await SharedPreferences.getInstance();
    _serverHost = prefs.getString(AppConstants.serverHostKey) ?? AppConstants.defaultServerHost;
    
    final savedToken = prefs.getString(AppConstants.tokenKey);
    if (savedToken != null) {
      final claims = AppConstants.decodeJwt(savedToken);
      if (claims != null) {
        _token = savedToken;
        _currentUser = User.fromJwtClaims(claims);
      } else {
        // Corrupted/expired token cleanup
        prefs.remove(AppConstants.tokenKey);
      }
    }
    notifyListeners();
  }

  // Saves a custom host IP/Domain
  Future<void> setServerHost(String host) async {
    _serverHost = host.trim();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.serverHostKey, _serverHost);
    notifyListeners();
  }

  // Auth operations
  Future<void> login(String email, String password) async {
    _isLoading = true;
    notifyListeners();
    try {
      final jwt = await _apiService.login(email.trim(), password);
      final claims = AppConstants.decodeJwt(jwt);
      if (claims == null) {
        throw 'Token phản hồi từ máy chủ không hợp lệ.';
      }
      
      _token = jwt;
      _currentUser = User.fromJwtClaims(claims);
      
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(AppConstants.tokenKey, jwt);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> register(String fullName, String email, String password) async {
    _isLoading = true;
    notifyListeners();
    try {
      await _apiService.register(fullName.trim(), email.trim(), password);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> changePassword(String oldPassword, String newPassword) async {
    if (!isAuthenticated) throw 'Bạn chưa đăng nhập.';
    _isLoading = true;
    notifyListeners();
    try {
      await _apiService.changePassword(_currentUser!.id, oldPassword, newPassword, _token!);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    _token = null;
    _currentUser = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(AppConstants.tokenKey);
    notifyListeners();
  }
}
