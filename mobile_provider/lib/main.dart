import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:provider/provider.dart';

import 'core/theme/app_theme.dart';
import 'core/time/app_time.dart';
import 'presentation/providers/app_state.dart';
import 'presentation/screens/app_root.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  AppTime.init();
  final appState = AppState();
  runApp(BarberTimeProviderApp(appState: appState));
  unawaited(_initializeApp(appState));
}

Future<void> _initializeApp(AppState appState) async {
  await initializeDateFormatting('pt_BR');
  await appState.bootstrap();
}

class BarberTimeProviderApp extends StatelessWidget {
  const BarberTimeProviderApp({super.key, required this.appState});

  final AppState appState;

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider.value(
      value: appState,
      child: MaterialApp(
        title: 'BarberTime Prestador',
        theme: AppTheme.light,
        locale: const Locale('pt', 'BR'),
        supportedLocales: const [Locale('pt', 'BR')],
        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        home: const AppRoot(),
      ),
    );
  }
}
