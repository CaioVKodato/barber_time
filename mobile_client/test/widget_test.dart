import 'package:barbertime_client/main.dart';
import 'package:barbertime_client/presentation/providers/app_state.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('App exibe tela de login após bootstrap', (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({});
    final appState = AppState();
    await appState.bootstrap();
    await tester.pumpWidget(BarberTimeApp(appState: appState));
    await tester.pump();

    expect(find.text('BarberTime'), findsOneWidget);
    expect(find.text('Entrar'), findsOneWidget);
  });
}
