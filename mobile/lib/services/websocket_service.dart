import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'api_service.dart';

class WebSocketService {
  WebSocketChannel? _channel;
  bool _isConnected = false;
  
  // Callbacks for UI updates
  Function(Map<String, dynamic>)? onMessageReceived;
  Function? onConnected;
  Function? onDisconnected;

  bool get isConnected => _isConnected;

  // Establish connection with automatic data streams routing
  void connect(int userId) async {
    if (_isConnected) return;
    
    try {
      final wsBaseUrl = await ApiService.getWebSocketUrl();
      final wsUrl = '$wsBaseUrl/ws/iot?type=USER&id=$userId';
      debugPrint('🔌 Connecting to WebSocket: $wsUrl');
      
      _channel = WebSocketChannel.connect(Uri.parse(wsUrl));
      _isConnected = true;
      onConnected?.call();
      
      _channel!.stream.listen(
        (message) {
          try {
            final data = json.decode(message) as Map<String, dynamic>;
            onMessageReceived?.call(data);
          } catch (e) {
            debugPrint('⚠️ Error parsing WebSocket message: $e | raw: $message');
          }
        },
        onError: (error) {
          debugPrint('❌ WebSocket stream error: $error');
          _handleDisconnect(userId);
        },
        onDone: () {
          debugPrint('🔌 WebSocket connection closed by remote peer.');
          _handleDisconnect(userId);
        },
        cancelOnError: true,
      );
    } catch (e) {
      debugPrint('❌ Connection attempt failed: $e');
      _handleDisconnect(userId);
    }
  }

  // Gracefully handles disconnections and queues reconnections
  void _handleDisconnect(int userId) {
    _isConnected = false;
    _channel = null;
    onDisconnected?.call();
    
    // Auto-reconnect loop after a 3-second throttle delay
    Future.delayed(const Duration(seconds: 3), () {
      if (!_isConnected) {
        debugPrint('🔄 Retrying WebSocket connection for User ID $userId...');
        connect(userId);
      }
    });
  }

  // Publish controls payload
  void sendCommand(String macAddress, String cmd) {
    if (_channel != null && _isConnected) {
      final payload = json.encode({
        'macAddress': macAddress,
        'cmd': cmd,
      });
      _channel!.sink.add(payload);
      debugPrint('🚀 Transmitted WS Command: $payload');
    } else {
      debugPrint('❌ Command transmission failed: WS Channel offline.');
    }
  }

  // Disconnect the stream manually (e.g., on log out)
  void disconnect() {
    _isConnected = false;
    _channel?.sink.close();
    _channel = null;
  }
}
