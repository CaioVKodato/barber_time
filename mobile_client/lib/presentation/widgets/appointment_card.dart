import 'package:flutter/material.dart';

import '../../core/theme/app_theme.dart';
import '../../core/time/app_time.dart';
import '../../models/appointment.dart';
import 'status_badge.dart';

class AppointmentCard extends StatelessWidget {
  const AppointmentCard({super.key, required this.appointment, this.onTap});

  final Appointment appointment;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final start = appointment.startsAt;
    final dimmed = appointment.isPast;

    return Card(
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: dimmed ? 0.06 : 0.10),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      AppTime.format(start, 'HH:mm'),
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 15,
                        color: AppColors.primary.withValues(alpha: dimmed ? 0.6 : 1),
                      ),
                    ),
                    Text(
                      AppTime.format(start, 'dd/MM'),
                      style: TextStyle(fontSize: 11, color: AppColors.primary.withValues(alpha: 0.6)),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      appointment.barberName,
                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _capitalize(AppTime.format(start, "EEE, dd 'de' MMM")),
                      style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
                    ),
                    const SizedBox(height: 8),
                    StatusBadge(appointment: appointment),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, color: Colors.grey.shade400),
            ],
          ),
        ),
      ),
    );
  }

  static String _capitalize(String s) => s.isEmpty ? s : s[0].toUpperCase() + s.substring(1);
}
