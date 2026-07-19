import 'dart:convert';
import 'package:flutter/material.dart';

class AppConstants {
  static const String tokenKey = 'autox_token';
  static const String serverHostKey = 'autox_server_host';
  
  // Default API address (Render server host)
  static const String defaultServerHost = 'https://smartdriveiot.onrender.com';
  
  // Decodes a JWT token payload to retrieve user details
  static Map<String, dynamic>? decodeJwt(String token) {
    final parts = token.split('.');
    if (parts.length != 3) return null;
    
    try {
      final payload = parts[1];
      // Normalize base64 encoded payload to ensure valid padding
      var normalized = base64Url.normalize(payload);
      final decodedString = utf8.decode(base64Url.decode(normalized));
      return json.decode(decodedString) as Map<String, dynamic>;
    } catch (e) {
      debugPrint('Error decoding JWT: $e');
      return null;
    }
  }
}
