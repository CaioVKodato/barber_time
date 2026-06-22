import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/app_state.dart';
import '../widgets/brand_logo.dart';
import 'login_screen.dart';
import 'home_shell.dart';

class AppRoot extends StatelessWidget {
  const AppRoot({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AppState>(
      builder: (context, state, _) {
        if (!state.bootstrapped) {
          return const Scaffold(
            body: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  BrandLogo(size: 76),
                  SizedBox(height: 32),
                  CircularProgressIndicator(),
                ],
              ),
            ),
          );
        }
        if (!state.isAuthenticated) {
          return const LoginScreen();
        }
        return const HomeShell();
      },
    );
  }
}
