import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/barber_appointment.dart';
import '../providers/app_state.dart';
import '../widgets/request_card.dart';
import 'request_detail_screen.dart';

enum RequestListKind { pending, confirmed, history }

class RequestsListScreen extends StatelessWidget {
  const RequestsListScreen({super.key, required this.kind});

  final RequestListKind kind;

  List<BarberAppointment> _itemsFor(AppState state) {
    switch (kind) {
      case RequestListKind.pending:
        return state.pendingAppointments;
      case RequestListKind.confirmed:
        return state.confirmedAppointments;
      case RequestListKind.history:
        return state.historyAppointments;
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final items = _itemsFor(state);

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
                return RequestCard(
                  appointment: item,
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => RequestDetailScreen(appointmentId: item.id),
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

  final RequestListKind kind;

  ({IconData icon, String title, String subtitle}) get _content {
    switch (kind) {
      case RequestListKind.pending:
        return (
          icon: Icons.inbox_outlined,
          title: 'Nenhuma solicitação pendente.',
          subtitle: 'Novos pedidos aparecem aqui automaticamente.',
        );
      case RequestListKind.confirmed:
        return (
          icon: Icons.event_available_outlined,
          title: 'Nenhum atendimento confirmado.',
          subtitle: 'Aceite uma solicitação para vê-la aqui.',
        );
      case RequestListKind.history:
        return (
          icon: Icons.history,
          title: 'Sem histórico ainda.',
          subtitle: 'Atendimentos passados e recusas aparecem aqui.',
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = _content;
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        const SizedBox(height: 120),
        Icon(c.icon, size: 56, color: Colors.grey.shade400),
        const SizedBox(height: 16),
        Center(
          child: Text(c.title, style: const TextStyle(fontWeight: FontWeight.w600)),
        ),
        const SizedBox(height: 8),
        Center(
          child: Text(
            c.subtitle,
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey.shade600),
          ),
        ),
      ],
    );
  }
}
