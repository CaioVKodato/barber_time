import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:barbertime_provider/core/time/app_time.dart';
import 'package:barbertime_provider/main.dart';
import 'package:barbertime_provider/presentation/providers/app_state.dart';

void main() {
  testWidgets('App do prestador exibe a tela de carregamento inicial', (tester) async {
    AppTime.init();
    await tester.pumpWidget(BarberTimeProviderApp(appState: AppState()));

    // Antes do bootstrap concluir, o app mostra o indicador de progresso.
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });
}
