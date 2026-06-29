import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../providers/app_state.dart';
import '../widgets/brand_logo.dart';
import 'requests_list_screen.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  static const _titles = ['Solicitações', 'Em andamento', 'Histórico'];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final state = context.read<AppState>();
      if (state.isAuthenticated) {
        state.refreshAppointments();
        state.startPolling();
      }
    });
  }

  /// Exibe um aviso para cada nova solicitação detectada pelo polling,
  /// concretizando a notificação assíncrona ao prestador.
  void _drainNewRequestAlerts(AppState state) {
    final alerts = state.takeNewRequestAlerts();
    if (alerts.isEmpty || !mounted) return;
    final messenger = ScaffoldMessenger.of(context);
    final label = alerts.length == 1
        ? 'Nova solicitação de ${alerts.first.clientFullName}'
        : '${alerts.length} novas solicitações recebidas';
    messenger.showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.notifications_active, color: Colors.white, size: 18),
            const SizedBox(width: 10),
            Expanded(child: Text(label)),
          ],
        ),
        backgroundColor: AppColors.primary,
        action: _index == 0
            ? null
            : SnackBarAction(
                label: 'Ver',
                textColor: AppColors.accentSoft,
                onPressed: () => setState(() => _index = 0),
              ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    WidgetsBinding.instance.addPostFrameCallback((_) => _drainNewRequestAlerts(state));

    final pages = const [
      RequestsListScreen(kind: RequestListKind.pending),
      RequestsListScreen(kind: RequestListKind.confirmed),
      RequestsListScreen(kind: RequestListKind.history),
    ];

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 16,
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const BrandMark(size: 30),
            const SizedBox(width: 10),
            Flexible(child: Text(_titles[_index])),
          ],
        ),
        actions: [
          if (state.pollingEnabled)
            Padding(
              padding: const EdgeInsets.only(right: 4),
              child: Icon(Icons.sync, size: 18, color: AppColors.accent),
            ),
          IconButton(
            tooltip: 'Sair',
            onPressed: () => state.logout(),
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: IndexedStack(index: _index, children: pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: [
          NavigationDestination(
            icon: _PendingIcon(count: state.pendingCount, selected: false),
            selectedIcon: _PendingIcon(count: state.pendingCount, selected: true),
            label: 'Solicitações',
          ),
          const NavigationDestination(
            icon: Icon(Icons.event_outlined),
            selectedIcon: Icon(Icons.event),
            label: 'Em andamento',
          ),
          const NavigationDestination(
            icon: Icon(Icons.history),
            selectedIcon: Icon(Icons.manage_history),
            label: 'Histórico',
          ),
        ],
      ),
    );
  }
}

/// Ícone da aba de solicitações com um *badge* mostrando quantas estão pendentes.
class _PendingIcon extends StatelessWidget {
  const _PendingIcon({required this.count, required this.selected});

  final int count;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    final icon = Icon(selected ? Icons.inbox : Icons.inbox_outlined);
    if (count == 0) return icon;
    return Badge(
      label: Text('$count'),
      backgroundColor: Colors.red.shade600,
      child: icon,
    );
  }
}
