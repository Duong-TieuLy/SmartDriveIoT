import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../models/vehicle.dart';
import '../providers/auth_provider.dart';
import '../providers/vehicle_provider.dart';
import '../widgets/vehicle_card.dart';
import 'profile_view.dart';
import 'vehicle_detail_view.dart';

class DashboardView extends StatefulWidget {
  const DashboardView({Key? key}) : super(key: key);

  @override
  State<DashboardView> createState() => _DashboardViewState();
}

class _DashboardViewState extends State<DashboardView> {
  final _addFormKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _macController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _refreshData();
    });
  }

  @override
  void dispose() {
    _nameController.dispose();
    _macController.dispose();
    super.dispose();
  }

  void _refreshData() {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final vehicleProvider = Provider.of<VehicleProvider>(context, listen: false);

    if (auth.isAuthenticated) {
      vehicleProvider.fetchCombinedVehicles(auth.currentUser!.id, auth.token!);
      vehicleProvider.initWebSocket(auth.currentUser!.id);
    }
  }

  // Opens BottomSheet dialog to register a new vehicle device
  void _showAddVehicleSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.cardBg,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            top: 24,
            left: 24,
            right: 24,
          ),
          child: Form(
            key: _addFormKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  'ĐĂNG KÝ XE IOT MỚI',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.0,
                    color: AppTheme.textMain,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                TextFormField(
                  controller: _nameController,
                  decoration: const InputDecoration(
                    labelText: 'Tên gợi nhớ xe',
                    prefixIcon: Icon(Icons.drive_file_rename_outline_rounded, color: AppTheme.textMuted),
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Vui lòng nhập tên xe.';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _macController,
                  decoration: const InputDecoration(
                    labelText: 'Địa chỉ MAC thiết bị (Ví dụ: ESP32-CAR-01)',
                    prefixIcon: Icon(Icons.fingerprint_rounded, color: AppTheme.textMuted),
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Vui lòng nhập địa chỉ MAC.';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () => _handleAddVehicle(context),
                  child: const Text('ĐĂNG KÝ THIẾT BỊ'),
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> _handleAddVehicle(BuildContext sheetContext) async {
    if (!_addFormKey.currentState!.validate()) return;

    final auth = Provider.of<AuthProvider>(context, listen: false);
    final vehicleProvider = Provider.of<VehicleProvider>(context, listen: false);

    try {
      await vehicleProvider.addVehicle(
        _nameController.text,
        _macController.text,
        auth.currentUser!.id,
        auth.token!,
      );
      
      _nameController.clear();
      _macController.clear();

      if (sheetContext.mounted) {
        Navigator.pop(sheetContext);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Đăng ký thiết bị thành công!'),
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

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final vehicleProvider = Provider.of<VehicleProvider>(context);

    final myVehicles = vehicleProvider.vehicles
        .where((v) => v.ownerId == auth.currentUser?.id)
        .toList();
    final sharedVehicles = vehicleProvider.vehicles
        .where((v) => v.ownerId != auth.currentUser?.id)
        .toList();

    final onlineCount = vehicleProvider.vehicles.where((v) => v.status == 'online').length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('SMART DRIVE IOT'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _refreshData,
          ),
          IconButton(
            icon: const Icon(Icons.account_circle_outlined),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const ProfileView()),
              );
            },
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showAddVehicleSheet,
        backgroundColor: AppTheme.primary,
        foregroundColor: Colors.white,
        child: const Icon(Icons.add_rounded),
      ),
      body: RefreshIndicator(
        onRefresh: () async => _refreshData(),
        color: AppTheme.accent,
        backgroundColor: AppTheme.cardBg,
        child: vehicleProvider.isLoading && vehicleProvider.vehicles.isEmpty
            ? const Center(child: CircularProgressIndicator(color: AppTheme.accent))
            : ListView(
                padding: const EdgeInsets.all(16.0),
                children: [
                  // Welcome header & mini-stats widget
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [AppTheme.primary.withOpacity(0.15), AppTheme.accent.withOpacity(0.05)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.white.withOpacity(0.04)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Xin chào, ${auth.currentUser?.fullName ?? 'Người dùng'}!',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.textMain,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          auth.currentUser?.role == 'admin' ? 'Quyền: Quản trị viên (Admin)' : 'Quyền: Thành viên (User)',
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppTheme.textMuted,
                          ),
                        ),
                        const SizedBox(height: 14),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            _buildMiniStat('Tổng số xe', '${vehicleProvider.vehicles.length}'),
                            _buildMiniStat('Đang kết nối', '$onlineCount', color: AppTheme.success),
                            _buildMiniStat(
                              'Kết nối WS', 
                              vehicleProvider.wsConnected ? 'Đã kết nối' : 'Đang thử lại',
                              color: vehicleProvider.wsConnected ? AppTheme.success : AppTheme.warning,
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Section 1: My Vehicles
                  Row(
                    children: [
                      const Icon(Icons.vpn_key_outlined, size: 20, color: AppTheme.accent),
                      const SizedBox(width: 8),
                      Text(
                        'XE SỞ HỮU (${myVehicles.length})',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.8,
                          color: AppTheme.textMain,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  if (myVehicles.isEmpty)
                    _buildEmptyListPlaceholder('Chưa đăng ký xe nào. Hãy bấm nút + để thêm.')
                  else
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: myVehicles.length,
                      itemBuilder: (context, index) {
                        final v = myVehicles[index];
                        return VehicleCard(
                          vehicle: v,
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => VehicleDetailView(vehicle: v)),
                          ),
                        );
                      },
                    ),
                  const SizedBox(height: 24),

                  // Section 2: Shared Vehicles
                  Row(
                    children: [
                      const Icon(Icons.people_outline_rounded, size: 20, color: AppTheme.accent),
                      const SizedBox(width: 8),
                      Text(
                        'XE ĐƯỢC CHIA SẺ (${sharedVehicles.length})',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.8,
                          color: AppTheme.textMain,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  if (sharedVehicles.isEmpty)
                    _buildEmptyListPlaceholder('Không có xe nào được chia sẻ với bạn.')
                  else
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: sharedVehicles.length,
                      itemBuilder: (context, index) {
                        final v = sharedVehicles[index];
                        return VehicleCard(
                          vehicle: v,
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => VehicleDetailView(vehicle: v)),
                          ),
                        );
                      },
                    ),
                  const SizedBox(height: 48),
                ],
              ),
      ),
    );
  }

  Widget _buildMiniStat(String label, String value, {Color color = AppTheme.textMain}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
        const SizedBox(height: 2),
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

  Widget _buildEmptyListPlaceholder(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
      decoration: BoxDecoration(
        color: AppTheme.cardBg.withOpacity(0.4),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withOpacity(0.02)),
      ),
      child: Center(
        child: Text(
          text,
          style: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}
