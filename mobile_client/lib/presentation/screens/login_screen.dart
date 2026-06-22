import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../providers/app_state.dart';
import '../widgets/brand_logo.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _fullName = TextEditingController();
  final _apiUrl = TextEditingController();
  bool _registerMode = false;
  bool _showAdvanced = false;
  bool _apiUrlInitialized = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_apiUrlInitialized) {
      _apiUrl.text = context.read<AppState>().apiBaseUrl;
      _apiUrlInitialized = true;
    }
  }

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    _fullName.dispose();
    _apiUrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final state = context.read<AppState>();
    await state.setApiBaseUrl(_apiUrl.text);
    if (_registerMode) {
      await state.register(_email.text.trim(), _password.text, _fullName.text.trim());
    } else {
      await state.login(_email.text.trim(), _password.text);
    }
    if (!mounted) return;
    if (state.error != null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(state.error!)));
      state.clearError();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Center(child: BrandLogo(size: 72)),
                    const SizedBox(height: 20),
                    Text(
                      _registerMode ? 'Cadastro de cliente' : 'Entrar como cliente',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppColors.primary.withValues(alpha: 0.7),
                          ),
                    ),
                    const SizedBox(height: 28),
                    if (_registerMode)
                      TextFormField(
                        controller: _fullName,
                        decoration: const InputDecoration(labelText: 'Nome completo'),
                        textInputAction: TextInputAction.next,
                        validator: (v) => (v == null || v.trim().length < 2) ? 'Informe seu nome' : null,
                      ),
                    if (_registerMode) const SizedBox(height: 12),
                    TextFormField(
                      controller: _email,
                      decoration: const InputDecoration(labelText: 'E-mail'),
                      keyboardType: TextInputType.emailAddress,
                      textInputAction: TextInputAction.next,
                      validator: (v) => (v == null || !v.contains('@')) ? 'E-mail inválido' : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _password,
                      decoration: const InputDecoration(labelText: 'Senha'),
                      obscureText: true,
                      onFieldSubmitted: (_) => _submit(),
                      validator: (v) => (v == null || v.length < 6) ? 'Mínimo 6 caracteres' : null,
                    ),
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: state.loading ? null : _submit,
                      child: state.loading
                          ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                          : Text(_registerMode ? 'Cadastrar' : 'Entrar'),
                    ),
                    TextButton(
                      onPressed: state.loading ? null : () => setState(() => _registerMode = !_registerMode),
                      child: Text(_registerMode ? 'Já tenho conta' : 'Criar conta'),
                    ),
                    ExpansionTile(
                      title: const Text('Configurações avançadas'),
                      initiallyExpanded: _showAdvanced,
                      onExpansionChanged: (v) => setState(() => _showAdvanced = v),
                      children: [
                        TextFormField(
                          controller: _apiUrl,
                          decoration: const InputDecoration(
                            labelText: 'URL da API',
                            helperText: 'Emulador Android: http://10.0.2.2:3000\nCelular físico: IP do PC',
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
