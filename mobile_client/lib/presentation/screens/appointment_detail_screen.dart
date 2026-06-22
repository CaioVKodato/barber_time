import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/app_config.dart';
import '../../core/time/app_time.dart';
import '../providers/app_state.dart';
import '../widgets/status_badge.dart';

class AppointmentDetailScreen extends StatelessWidget {
  const AppointmentDetailScreen({super.key, required this.appointmentId});

  final String appointmentId;

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final appointment = state.findById(appointmentId);

    if (appointment == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Detalhes')),
        body: const Center(child: Text('Agendamento não encontrado.')),
      );
    }

    String fmt(DateTime d) => AppTime.format(d, 'dd/MM/yyyy HH:mm');

    return Scaffold(
      appBar: AppBar(title: const Text('Detalhes do agendamento')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            StatusBadge(appointment: appointment),
            const SizedBox(height: 20),
            _row('Barbeiro', appointment.barberName),
            _row('Início', fmt(appointment.startsAt)),
            _row('Fim', fmt(appointment.endsAt)),
            _row('Status', appointment.displayStatusLabel),
            const Spacer(),
            if (!appointment.isPast && (appointment.isPending || appointment.isConfirmed))
              SizedBox(
                width: double.infinity,
                child: FilledButton.tonal(
                  onPressed: state.loading
                      ? null
                      : () async {
                          final ok = await showDialog<bool>(
                            context: context,
                            builder: (ctx) => AlertDialog(
                              title: const Text('Cancelar agendamento?'),
                              actions: [
                                TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Não')),
                                FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Sim')),
                              ],
                            ),
                          );
                          if (ok == true && context.mounted) {
                            final success = await state.cancelAppointment(appointment.id);
                            if (success && context.mounted) Navigator.pop(context);
                          }
                        },
                  child: const Text('Cancelar agendamento'),
                ),
              ),
            if (appointment.isPending && !appointment.isPast)
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Text(
                  'Atualização automática a cada ${AppConfig.pollingIntervalSeconds}s — quando o barbeiro confirmar, o status mudará aqui.',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 90, child: Text(label, style: const TextStyle(fontWeight: FontWeight.w600))),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }
}
