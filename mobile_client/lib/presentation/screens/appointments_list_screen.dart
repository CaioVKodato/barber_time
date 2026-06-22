import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/appointment.dart';
import '../providers/app_state.dart';
import '../widgets/appointment_card.dart';
import 'appointment_detail_screen.dart';

enum AppointmentListKind { upcoming, past }

class AppointmentsListScreen extends StatelessWidget {
  const AppointmentsListScreen({super.key, this.kind = AppointmentListKind.upcoming});

  final AppointmentListKind kind;

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final List<Appointment> items =
        kind == AppointmentListKind.upcoming ? state.upcomingAppointments : state.pastAppointments;

    if (state.loading && state.appointments.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    return RefreshIndicator(
      onRefresh: state.refreshAppointments,
      child: items.isEmpty
          ? _EmptyState(kind: kind)
          : ListView.builder(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.symmetric(vertical: 8),
              itemCount: items.length,
              itemBuilder: (context, index) {
                final item = items[index];
                return AppointmentCard(
                  appointment: item,
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => AppointmentDetailScreen(appointmentId: item.id),
                      ),
                    );
                  },
                );
              },
            ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.kind});

  final AppointmentListKind kind;

  @override
  Widget build(BuildContext context) {
    final isUpcoming = kind == AppointmentListKind.upcoming;
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        const SizedBox(height: 120),
        Icon(
          isUpcoming ? Icons.event_available_outlined : Icons.history,
          size: 56,
          color: Colors.grey.shade400,
        ),
        const SizedBox(height: 16),
        Center(
          child: Text(
            isUpcoming ? 'Nenhum agendamento próximo.' : 'Nenhum agendamento concluído ainda.',
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
        ),
        const SizedBox(height: 8),
        Center(
          child: Text(
            isUpcoming
                ? 'Use a aba Agendar para solicitar um horário.'
                : 'Seus atendimentos passados aparecerão aqui.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey.shade600),
          ),
        ),
      ],
    );
  }
}
