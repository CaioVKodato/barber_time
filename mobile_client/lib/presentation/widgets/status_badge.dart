import 'package:flutter/material.dart';

import '../../models/appointment.dart';

class StatusBadge extends StatelessWidget {
  const StatusBadge({super.key, required this.appointment});

  final Appointment appointment;

  Color _color(BuildContext context) {
    switch (appointment.displayStatus) {
      case 'confirmed':
        return Colors.green.shade700;
      case 'pending':
        return Colors.orange.shade800;
      case 'cancelled':
        return Colors.red.shade700;
      case 'completed':
        return Colors.blueGrey.shade600;
      case 'expired':
        return Colors.grey.shade600;
      default:
        return Theme.of(context).colorScheme.primary;
    }
  }

  IconData get _icon {
    switch (appointment.displayStatus) {
      case 'confirmed':
        return Icons.check_circle_outline;
      case 'pending':
        return Icons.hourglass_top;
      case 'cancelled':
        return Icons.cancel_outlined;
      case 'completed':
        return Icons.done_all;
      case 'expired':
        return Icons.history_toggle_off;
      default:
        return Icons.event;
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = _color(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.6)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(_icon, size: 13, color: color),
          const SizedBox(width: 4),
          Text(
            appointment.displayStatusLabel,
            style: TextStyle(color: color, fontWeight: FontWeight.w600, fontSize: 12),
          ),
        ],
      ),
    );
  }
}
