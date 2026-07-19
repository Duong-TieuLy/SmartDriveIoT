import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../models/vehicle.dart';
import '../models/control_history.dart';
import '../providers/auth_provider.dart';
import '../providers/vehicle_provider.dart';

class ControlHistoryView extends StatefulWidget {
  final Vehicle vehicle;

  const ControlHistoryView({
    Key? key,
    required this.vehicle,
  }) : super(key: key);

  @override
  State<ControlHistoryView> createState() => _ControlHistoryViewState();
}

class _ControlHistoryViewState extends State<ControlHistoryView> {
  int _currentPage = 0;
  int _totalPages = 1;
  bool _isLoadingHistory = false;
  List<ControlHistory> _historyList = [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadHistory(page: 0);
    });
  }

  Future<void> _loadHistory({required int page}) async {
    setState(() {
      _isLoadingHistory = true;
    });

    final auth = Provider.of<AuthProvider>(context, listen: false);
    final vehicleProvider = Provider.of<VehicleProvider>(context, listen: false);

    try {
      final data = await vehicleProvider.fetchControlHistory(
        widget.vehicle.id,
        page,
        15, // Page size
        auth.token!,
      );

      setState(() {
        final newItems = data['content'] as List<ControlHistory>;
        if (page == 0) {
          _historyList = newItems;
        } else {
          _historyList.addAll(newItems);
        }
        _currentPage = data['currentPage'] as int;
        _totalPages = data['totalPages'] as int;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi tải lịch sử: $e'),
            backgroundColor: AppTheme.danger,
          ),
        );
      }
    } finally {
      setState(() {
        _isLoadingHistory = false;
      });
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'SENT':
        return AppTheme.success;
      case 'AUTO_STOPPED':
        return AppTheme.danger;
      case 'AUTO_RESUMED':
        return AppTheme.accent;
      default:
        return AppTheme.textMuted;
    }
  }

  String _formatDateTime(DateTime dt) {
    // Format to HH:mm:ss dd/MM/yyyy
    final hour = dt.hour.toString().padLeft(2, '0');
    final minute = dt.minute.toString().padLeft(2, '0');
    final second = dt.second.toString().padLeft(2, '0');
    final day = dt.day.toString().padLeft(2, '0');
    final month = dt.month.toString().padLeft(2, '0');
    final year = dt.year.toString();
    return '$hour:$minute:$second $day/$month/$year';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('LỊCH SỬ ĐIỀU KHIỂN'),
      ),
      body: _isLoadingHistory && _historyList.isEmpty
          ? const Center(child: CircularProgressIndicator(color: AppTheme.accent))
          : _historyList.isEmpty
              ? const Center(
                  child: Text(
                    'Không có lịch sử lệnh nào cho xe này.',
                    style: TextStyle(color: AppTheme.textMuted),
                  ),
                )
              : Column(
                  children: [
                    Expanded(
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _historyList.length + (_currentPage < _totalPages - 1 ? 1 : 0),
                        itemBuilder: (context, index) {
                          if (index == _historyList.length) {
                            return Padding(
                              padding: const EdgeInsets.symmetric(vertical: 16.0),
                              child: Center(
                                child: TextButton(
                                  onPressed: _isLoadingHistory
                                      ? null
                                      : () => _loadHistory(page: _currentPage + 1),
                                  child: _isLoadingHistory
                                      ? const SizedBox(
                                          width: 16,
                                          height: 16,
                                          child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.accent),
                                        )
                                      : const Text('TẢI THÊM LỊCH SỬ'),
                                ),
                              ),
                            );
                          }

                          final item = _historyList[index];
                          final statusColor = _getStatusColor(item.status);

                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            child: Padding(
                              padding: const EdgeInsets.all(14.0),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        item.command,
                                        style: const TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                          color: AppTheme.accent,
                                          letterSpacing: 0.5,
                                        ),
                                      ),
                                      const SizedBox(height: 6),
                                      Text(
                                        _formatDateTime(item.timestamp.toLocal()),
                                        style: const TextStyle(
                                          fontSize: 12,
                                          color: AppTheme.textMuted,
                                        ),
                                      ),
                                    ],
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: statusColor.withOpacity(0.12),
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(color: statusColor.withOpacity(0.3)),
                                    ),
                                    child: Text(
                                      item.status.toUpperCase(),
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                        color: statusColor,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
    );
  }
}
