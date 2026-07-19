import 'package:flutter/material.dart';
import '../core/theme.dart';

class DirectionPad extends StatelessWidget {
  final Function(String) onCommandStart;
  final VoidCallback onCommandEnd;
  final bool isEnabled;

  const DirectionPad({
    Key? key,
    required this.onCommandStart,
    required this.onCommandEnd,
    this.isEnabled = true,
  }) : super(key: key);

  Widget _buildControlBtn({
    required IconData icon,
    required String command,
    required Color color,
  }) {
    return GestureDetector(
      onTapDown: isEnabled ? (_) => onCommandStart(command) : null,
      onTapUp: isEnabled ? (_) => onCommandEnd() : null,
      onTapCancel: isEnabled ? () => onCommandEnd() : null,
      child: Container(
        width: 72,
        height: 72,
        decoration: BoxDecoration(
          color: isEnabled ? AppTheme.cardBg : AppTheme.cardBg.withOpacity(0.4),
          shape: BoxShape.circle,
          border: Border.all(
            color: isEnabled ? color.withOpacity(0.4) : Colors.white10,
            width: 2,
          ),
          boxShadow: isEnabled
              ? [
                  BoxShadow(
                    color: color.withOpacity(0.15),
                    blurRadius: 8,
                    spreadRadius: 1,
                  )
                ]
              : [],
        ),
        child: Icon(
          icon,
          size: 32,
          color: isEnabled ? color : AppTheme.textMuted.withOpacity(0.5),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppTheme.cardBg.withOpacity(0.3),
        borderRadius: BorderRadius.circular(100),
        border: Border.all(color: Colors.white.withOpacity(0.03)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Row 1: Forward
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildControlBtn(
                icon: Icons.keyboard_arrow_up_rounded,
                command: 'FORWARD',
                color: AppTheme.accent,
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Row 2: Left, STOP, Right
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildControlBtn(
                icon: Icons.keyboard_arrow_left_rounded,
                command: 'LEFT',
                color: AppTheme.accent,
              ),
              const SizedBox(width: 12),
              // Center STOP button
              GestureDetector(
                onTap: isEnabled ? () => onCommandStart('STOP') : null,
                child: Container(
                  width: 76,
                  height: 76,
                  decoration: BoxDecoration(
                    color: isEnabled ? AppTheme.danger.withOpacity(0.1) : Colors.white.withOpacity(0.02),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isEnabled ? AppTheme.danger : Colors.white10,
                      width: 3,
                    ),
                    boxShadow: isEnabled
                        ? [
                            BoxShadow(
                              color: AppTheme.danger.withOpacity(0.2),
                              blurRadius: 12,
                              spreadRadius: 2,
                            )
                          ]
                        : [],
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    'STOP',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: isEnabled ? AppTheme.danger : AppTheme.textMuted.withOpacity(0.5),
                      letterSpacing: 1.0,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              _buildControlBtn(
                icon: Icons.keyboard_arrow_right_rounded,
                command: 'RIGHT',
                color: AppTheme.accent,
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Row 3: Backward
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildControlBtn(
                icon: Icons.keyboard_arrow_down_rounded,
                command: 'BACKWARD',
                color: AppTheme.accent,
              ),
            ],
          ),
        ],
      ),
    );
  }
}
