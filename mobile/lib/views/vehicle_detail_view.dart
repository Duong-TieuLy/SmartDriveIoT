import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../models/vehicle.dart';
import '../providers/auth_provider.dart';
import '../providers/vehicle_provider.dart';
import '../widgets/direction_pad.dart';
import '../widgets/terminal_view.dart';
import 'control_history_view.dart';

class VehicleDetailView extends StatefulWidget {
  final Vehicle vehicle;

  const VehicleDetailView({
    Key? key,
    required this.vehicle,
  }) : super(key: key);

  @override
  State<VehicleDetailView> createState() => _VehicleDetailViewState();
}

class _VehicleDetailViewState extends State<VehicleDetailView> {
  // Local state for mode switching ('manual' or 'auto')
  String _mode = 'manual';
  bool _isAutoRunning = false;
  final _emailController = TextEditingController();
  final _shareFormKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();
    // Default mode setup matching active status if known
  }

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  void _handleCommandStart(String cmd) {
    final vehicleProvider = Provider.of<VehicleProvider>(context, listen: false);
    vehicleProvider.sendVehicleCommand(widget.vehicle.id, cmd);
  }

  void _handleCommandEnd() {
    final vehicleProvider = Provider.of<VehicleProvider>(context, listen: false);
    vehicleProvider.sendVehicleCommand(widget.vehicle.id, 'STOP');
  }

  void _handleModeChange(String nextMode) {
    setState(() {
      _mode = nextMode;
    });

    final vehicleProvider = Provider.of<VehicleProvider>(context, listen: false);
    if (nextMode == 'manual') {
      _isAutoRunning = false;
      vehicleProvider.sendVehicleCommand(widget.vehicle.id, 'MODE_MANUAL');
      vehicleProvider.sendVehicleCommand(widget.vehicle.id, 'STOP');
    }
  }

  void _toggleAuto() {
    final vehicleProvider = Provider.of<VehicleProvider>(context, listen: false);
    setState(() {
      _isAutoRunning = !_isAutoRunning;
      if (_isAutoRunning) {
        vehicleProvider.sendVehicleCommand(widget.vehicle.id, 'MODE_AUTO');
      } else {
        vehicleProvider.sendVehicleCommand(widget.vehicle.id, 'MODE_MANUAL');
        vehicleProvider.sendVehicleCommand(widget.vehicle.id, 'STOP');
      }
    });
  }

  // Opens dialog to share the vehicle with another user by email
  void _showShareDialog() {
    showDialog(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          backgroundColor: AppTheme.cardBg,
          title: const Text(
            'CHIA SẺ XE',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: 0.8),
          ),
          content: Form(
            key: _shareFormKey,
            child: TextFormField(
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(
                labelText: 'Email tài xế nhận chia sẻ',
                prefixIcon: Icon(Icons.email_outlined),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Vui lòng nhập email.';
                }
                if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
                  return 'Định dạng email không hợp lệ.';
                }
                return null;
              },
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('HỦY', style: TextStyle(color: AppTheme.textMuted)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(minimumSize: const Size(80, 40)),
              onPressed: () => _handleShare(dialogContext),
              child: const Text('CHIA SẺ'),
            ),
          ],
        );
      },
    );
  }

  Future<void> _handleShare(BuildContext dialogContext) async {
    if (!_shareFormKey.currentState!.validate()) return;

    final auth = Provider.of<AuthProvider>(context, listen: false);
    final vehicleProvider = Provider.of<VehicleProvider>(context, listen: false);

    try {
      await vehicleProvider.shareVehicle(
        widget.vehicle.dbId,
        auth.currentUser!.id,
        _emailController.text,
        auth.token!,
      );
      _emailController.clear();
      if (dialogContext.mounted) {
        Navigator.pop(dialogContext);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Đã chia sẻ quyền sử dụng thiết bị thành công!'),
            backgroundColor: AppTheme.success,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString()),
          backgroundColor: AppTheme.danger,
        ),
      );
    }
  }

  Future<void> _handleDelete() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        backgroundColor: AppTheme.cardBg,
        title: const Text('XÁC NHẬN XÓA'),
        content: const Text('Bạn có chắc chắn muốn xóa thiết bị này khỏi hệ thống không? Hành động này không thể hoàn tác.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(c, false),
            child: const Text('HỦY', style: TextStyle(color: AppTheme.textMuted)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.danger,
              minimumSize: const Size(80, 40),
            ),
            onPressed: () => Navigator.pop(c, true),
            child: const Text('XÓA'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    final auth = Provider.of<AuthProvider>(context, listen: false);
    final vehicleProvider = Provider.of<VehicleProvider>(context, listen: false);

    try {
      await vehicleProvider.deleteVehicle(
        widget.vehicle.dbId,
        auth.currentUser!.id,
        auth.token!,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Xóa thiết bị thành công!'), backgroundColor: AppTheme.success),
        );
        Navigator.pop(context); // Go back to dashboard
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: AppTheme.danger),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final vehicleProvider = Provider.of<VehicleProvider>(context);

    // Find the latest state in provider corresponding to this vehicle
    final vehicle = vehicleProvider.vehicles.firstWhere(
      (v) => v.id == widget.vehicle.id,
      orElse: () => widget.vehicle,
    );

    final isOwner = vehicle.ownerId == auth.currentUser?.id;
    final isOnline = vehicle.status == 'online';
    final batteryColor = vehicle.battery < 20
        ? AppTheme.danger
        : vehicle.battery < 40
            ? AppTheme.warning
            : AppTheme.success;

    // Get logs for this device
    final logs = vehicleProvider.deviceLogs[vehicle.id] ?? [];

    return Scaffold(
      appBar: AppBar(
        title: Text(vehicle.name.toUpperCase()),
        actions: [
          if (isOwner)
            IconButton(
              icon: const Icon(Icons.share_outlined, color: AppTheme.accent),
              onPressed: _showShareDialog,
            ),
          IconButton(
            icon: const Icon(Icons.history_rounded),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => ControlHistoryView(vehicle: vehicle),
                ),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Vehicle connection status banner
            Container(
              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
              decoration: BoxDecoration(
                color: isOnline ? AppTheme.success.withOpacity(0.08) : AppTheme.danger.withOpacity(0.08),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: isOnline ? AppTheme.success.withOpacity(0.2) : AppTheme.danger.withOpacity(0.2),
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    isOnline ? Icons.check_circle_outline_rounded : Icons.error_outline_rounded,
                    color: isOnline ? AppTheme.success : AppTheme.danger,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      isOnline
                          ? 'Thiết bị đang trực tuyến (ONLINE). Sẵn sàng nhận lệnh.'
                          : 'Thiết bị ngoại tuyến (OFFLINE). Hãy kết nối thiết bị với mạng.',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: isOnline ? AppTheme.success : AppTheme.danger,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Vehicle Metadata Grid Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _buildMetaItem('MÃ MAC (THIẾT BỊ)', vehicle.id, Icons.vpn_key_rounded),
                        _buildMetaItem('BIỂN SỐ', vehicle.plate, Icons.tag_rounded),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _buildMetaItem('VỊ TRÍ THỬ NGHIỆM', vehicle.location, Icons.location_on_rounded),
                        _buildMetaItem(
                          'MỨC PIN', 
                          '${vehicle.battery}%', 
                          Icons.battery_charging_full_rounded,
                          color: batteryColor,
                        ),
                      ],
                    ),
                    if (vehicle.realtimeDistance != null) ...[
                      const SizedBox(height: 16),
                      const Divider(color: Colors.white10, height: 1),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.sensors_rounded, size: 20, color: AppTheme.accent),
                              SizedBox(width: 8),
                              Text(
                                'KHOẢNG CÁCH VẬT CẢN',
                                style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textMuted),
                              ),
                            ],
                          ),
                          Text(
                            '${vehicle.realtimeDistance!.toStringAsFixed(1)} cm',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.accent,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Mode Selector Tabs
            Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => _handleModeChange('manual'),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      decoration: BoxDecoration(
                        color: _mode == 'manual' ? AppTheme.primary : AppTheme.cardBg,
                        borderRadius: const BorderRadius.horizontal(left: Radius.circular(10)),
                        border: Border.all(color: _mode == 'manual' ? AppTheme.primary : Colors.white10),
                      ),
                      alignment: Alignment.center,
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.gamepad_outlined, size: 18),
                          SizedBox(width: 8),
                          Text('THỦ CÔNG', style: TextStyle(fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: GestureDetector(
                    onTap: () => _handleModeChange('auto'),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      decoration: BoxDecoration(
                        color: _mode == 'auto' ? AppTheme.primary : AppTheme.cardBg,
                        borderRadius: const BorderRadius.horizontal(right: Radius.circular(10)),
                        border: Border.all(color: _mode == 'auto' ? AppTheme.primary : Colors.white10),
                      ),
                      alignment: Alignment.center,
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.smart_toy_outlined, size: 18),
                          SizedBox(width: 8),
                          Text('TỰ ĐỘNG LÁI', style: TextStyle(fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Mode Deck
            if (_mode == 'manual') ...[
              const Center(
                child: Text(
                  'Bấm và giữ các phím mũi tên để di chuyển xe, nhả ra để dừng xe.',
                  style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
                  textAlign: TextAlign.center,
                ),
              ),
              const SizedBox(height: 16),
              Center(
                child: DirectionPad(
                  isEnabled: isOnline,
                  onCommandStart: _handleCommandStart,
                  onCommandEnd: _handleCommandEnd,
                ),
              ),
            ] else ...[
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppTheme.cardBg,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.white10),
                ),
                child: Column(
                  children: [
                    const Icon(Icons.sensor_occupied_rounded, size: 48, color: AppTheme.accent),
                    const SizedBox(height: 12),
                    const Text(
                      'TỰ ĐỘNG TRÁNH VẬT CẢN',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 0.8),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Khi được kích hoạt, xe sẽ tự động chạy tiến thẳng. Khi cảm biến siêu âm phát hiện vật cản (< 20 cm), hệ thống sẽ ra lệnh rẽ trái để né tránh.',
                      style: TextStyle(fontSize: 12, color: AppTheme.textMuted, height: 1.4),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 20),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _isAutoRunning ? AppTheme.danger : AppTheme.success,
                      ),
                      onPressed: isOnline ? _toggleAuto : null,
                      child: Text(_isAutoRunning ? 'TẮT TỰ ĐỘNG LÁI' : 'BẬT TỰ ĐỘNG LÁI'),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 24),

            // Console Logs
            TerminalView(
              logs: logs,
              onClear: () {
                // Clear locally in provider
                setState(() {
                  logs.clear();
                });
              },
            ),
            const SizedBox(height: 32),

            // Delete Vehicle action (Only for Owner)
            if (isOwner) ...[
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.danger.withOpacity(0.1),
                  foregroundColor: AppTheme.danger,
                  side: const BorderSide(color: AppTheme.danger, width: 1.5),
                  elevation: 0,
                ),
                onPressed: _handleDelete,
                child: const Text('XÓA XE KHỎI HỆ THỐNG'),
              ),
              const SizedBox(height: 24),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildMetaItem(String label, String value, IconData icon, {Color color = AppTheme.textMain}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 14, color: AppTheme.textMuted),
            const SizedBox(width: 4),
            Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted, fontWeight: FontWeight.bold)),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
      ],
    );
  }
}
