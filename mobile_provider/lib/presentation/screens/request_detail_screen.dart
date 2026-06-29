import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/app_config.dart';
import '../../core/theme/app_theme.dart';
import '../../core/time/app_time.dart';
import '../providers/app_state.dart';
import '../widgets/status_badge.dart';

class RequestDetailScreen extends StatelessWidget {
  const RequestDetailScreen({super.key, required this.appointmentId});

  final String appointmentId;

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final appointment = state.findById(appointmentId);

    if (appointment == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Detalhes')),
        body: const Center(child: Text('Solicitação não encontrada.')),
      );
    }

    String fmt(DateTime d) => AppTime.format(d, 'dd/MM/yyyy HH:mm');

    return Scaffold(
      appBar: AppBar(title: const Text('Detalhes da solicitação')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            StatusBadge(appointment: appointment),
            const SizedBox(height: 20),
            _row('Cliente', appointment.clientFullName),
            if (appointment.clientEmail.isNotEmpty) _row('E-mail', appointment.clientEmail),
            _row('Início', fmt(appointment.startsAt)),
            _row('Fim', fmt(appointment.endsAt)),
            _row('Status', appointment.displayStatusLabel),
            const Spacer(),
            if (appointment.isActionable) ...[
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.red.shade700,
                        side: BorderSide(color: Colors.red.shade300),
                        minimumSize: const Size.fromHeight(52),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      icon: const Icon(Icons.close),
                      label: const Text('Recusar'),
                      onPressed: state.loading
                          ? null
                          : () => _handleAction(
                                context,
                                state,
                                appointment.id,
                                isAccept: false,
                                clientName: appointment.clientFullName,
                              ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton.icon(
                      style: FilledButton.styleFrom(
                        minimumSize: const Size.fromHeight(52),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      icon: const Icon(Icons.check),
                      label: const Text('Aceitar'),
                      onPressed: state.loading
                          ? null
                          : () => _handleAction(
                                context,
                                state,
                                appointment.id,
                                isAccept: true,
                                clientName: appointment.clientFullName,
                              ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                'Ao aceitar ou recusar, o cliente é notificado automaticamente '
                '(evento publicado no MOM). A fila atualiza a cada '
                '${AppConfig.pollingIntervalSeconds}s.',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ] else if (appointment.isConfirmed && !appointment.isPast)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.06),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Text(
                  'Atendimento confirmado. O cliente já foi avisado e o horário '
                  'está reservado na sua agenda.',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ),
          ],
        ),
      ),
    );
  }

  Future<void> _handleAction(
    BuildContext context,
    AppState state,
    String id, {
    required bool isAccept,
    required String clientName,
  }) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(isAccept ? 'Aceitar solicitação?' : 'Recusar solicitação?'),
        content: Text(
          isAccept
              ? 'Confirmar o atendimento de $clientName neste horário?'
              : 'Recusar a solicitação de $clientName? O horário ficará livre novamente.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Voltar')),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(isAccept ? 'Aceitar' : 'Recusar'),
          ),
        ],
      ),
    );
    if (ok != true || !context.mounted) return;

    final success = isAccept
        ? await state.confirmAppointment(id)
        : await state.rejectAppointment(id);

    if (!context.mounted) return;
    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(isAccept ? 'Solicitação aceita.' : 'Solicitação recusada.')),
      );
      Navigator.pop(context);
    } else if (state.error != null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(state.error!)));
      state.clearError();
    }
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
