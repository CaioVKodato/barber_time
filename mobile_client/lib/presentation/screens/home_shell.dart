import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../providers/app_state.dart';
import '../widgets/brand_logo.dart';
import 'appointments_list_screen.dart';
import 'create_appointment_screen.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  static const _titles = ['Próximos agendamentos', 'Histórico', 'Novo agendamento'];

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

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final pages = const [
      AppointmentsListScreen(kind: AppointmentListKind.upcoming),
      AppointmentsListScreen(kind: AppointmentListKind.past),
      CreateAppointmentScreen(),
    ];

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 16,
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const BrandMark(size: 30),
            const SizedBox(width: 10),
            Text(_titles[_index]),
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
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.event_outlined),
            selectedIcon: Icon(Icons.event),
            label: 'Próximos',
          ),
          NavigationDestination(
            icon: Icon(Icons.history),
            selectedIcon: Icon(Icons.manage_history),
            label: 'Histórico',
          ),
          NavigationDestination(
            icon: Icon(Icons.add_circle_outline),
            selectedIcon: Icon(Icons.add_circle),
            label: 'Agendar',
          ),
        ],
      ),
    );
  }
}
