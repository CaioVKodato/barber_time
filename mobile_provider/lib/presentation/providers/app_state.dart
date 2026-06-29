import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../config/app_config.dart';
import '../../core/errors/api_exception.dart';
import '../../data/api/api_client.dart';
import '../../data/repositories/auth_repository.dart';
import '../../data/repositories/barber_appointment_repository.dart';
import '../../models/auth_result.dart';
import '../../models/barber_appointment.dart';
import '../../models/user.dart';

/// Estado global do app do prestador (barbeiro).
///
/// Responsável por: sessão/JWT, carga da fila de solicitações via REST e
/// atualização assíncrona por *polling* — quando o cliente cria uma solicitação,
/// o backend publica `appointment.requested` no MOM e a fila do barbeiro muda;
/// este estado detecta os novos itens e expõe alertas para a UI, sem que o
/// barbeiro precise atualizar a tela manualmente.
class AppState extends ChangeNotifier {
  AppState();

  late ApiClient _client;
  late AuthRepository _authRepository;
  late BarberAppointmentRepository _appointmentRepository;

  String _apiBaseUrl = AppConfig.defaultBaseUrlForPlatform();
  String? _token;
  User? _user;
  List<BarberAppointment> _appointments = [];
  bool _loading = false;
  String? _error;
  Timer? _pollTimer;
  bool _pollingEnabled = false;
  bool _bootstrapped = false;

  /// IDs pendentes já conhecidos — base para detectar novas solicitações.
  final Set<String> _knownPendingIds = {};
  bool _firstLoadDone = false;

  /// Novas solicitações detectadas no último ciclo de polling, ainda não
  /// exibidas ao barbeiro (a UI as consome via [takeNewRequestAlerts]).
  final List<BarberAppointment> _newRequestAlerts = [];

  String get apiBaseUrl => _apiBaseUrl;
  User? get user => _user;
  List<BarberAppointment> get appointments => List.unmodifiable(_appointments);

  /// Solicitações pendentes que ainda podem ser aceitas/recusadas (mais antigas
  /// primeiro — quem pediu há mais tempo aparece no topo).
  List<BarberAppointment> get pendingAppointments {
    final items = _appointments.where((a) => a.isActionable).toList()
      ..sort((a, b) => a.createdAt.compareTo(b.createdAt));
    return List.unmodifiable(items);
  }

  /// Agendamentos confirmados que ainda vão acontecer (em andamento).
  List<BarberAppointment> get confirmedAppointments {
    final items = _appointments.where((a) => a.isConfirmed && !a.isPast).toList()
      ..sort((a, b) => a.startsAt.compareTo(b.startsAt));
    return List.unmodifiable(items);
  }

  /// Histórico: já aconteceram (concluídos/expirados) ou recusados/cancelados.
  List<BarberAppointment> get historyAppointments {
    final items = _appointments.where((a) => a.isPast || a.isCancelled).toList()
      ..sort((a, b) => b.startsAt.compareTo(a.startsAt));
    return List.unmodifiable(items);
  }

  int get pendingCount => pendingAppointments.length;

  bool get isAuthenticated => _token != null && _user != null;
  bool get bootstrapped => _bootstrapped;
  bool get loading => _loading;
  String? get error => _error;
  bool get pollingEnabled => _pollingEnabled;

  Future<void> bootstrap() async {
    final prefs = await SharedPreferences.getInstance();
    _apiBaseUrl = prefs.getString(AppConfig.prefsApiUrlKey) ??
        AppConfig.defaultBaseUrlForPlatform();
    _token = prefs.getString(AppConfig.prefsTokenKey);
    final userJson = prefs.getString(AppConfig.prefsUserKey);
    if (userJson != null) {
      try {
        _user = User.fromJson(jsonDecode(userJson) as Map<String, dynamic>);
      } catch (_) {
        _token = null;
        await prefs.remove(AppConfig.prefsTokenKey);
        await prefs.remove(AppConfig.prefsUserKey);
      }
    }
    _initRepositories();
    notifyListeners();
    if (isAuthenticated) {
      unawaited(_restoreSession());
    }
    _bootstrapped = true;
    notifyListeners();
  }

  Future<void> _restoreSession() async {
    await refreshAppointments();
    startPolling();
  }

  void _initRepositories() {
    _client = ApiClient(baseUrl: _apiBaseUrl, token: _token);
    _authRepository = AuthRepository(_client);
    _appointmentRepository = BarberAppointmentRepository(_client);
  }

  Future<void> setApiBaseUrl(String url) async {
    final trimmed = url.trim().replaceAll(RegExp(r'/$'), '');
    _apiBaseUrl = trimmed.isEmpty ? AppConfig.defaultBaseUrlForPlatform() : trimmed;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConfig.prefsApiUrlKey, _apiBaseUrl);
    _initRepositories();
    notifyListeners();
  }

  Future<void> login(String email, String password) async {
    _setLoading(true);
    try {
      final AuthResult result = await _authRepository.login(email, password);
      if (!result.user.isBarber) {
        _error = 'Esta conta não é de barbeiro. Use o app do cliente para agendar.';
        return;
      }
      _token = result.token;
      _user = result.user;
      _client.token = _token;
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(AppConfig.prefsTokenKey, _token!);
      await prefs.setString(
        AppConfig.prefsUserKey,
        jsonEncode({
          'id': _user!.id,
          'email': _user!.email,
          'fullName': _user!.fullName,
          'role': _user!.role,
        }),
      );
      _error = null;
      await refreshAppointments();
      startPolling();
    } on ApiException catch (e) {
      _error = e.message;
    } catch (_) {
      _error = 'Sem conexão com a API. Verifique se ela está rodando (npm run dev).';
    } finally {
      _setLoading(false);
    }
  }

  Future<void> logout() async {
    stopPolling();
    _token = null;
    _user = null;
    _appointments = [];
    _knownPendingIds.clear();
    _newRequestAlerts.clear();
    _firstLoadDone = false;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(AppConfig.prefsTokenKey);
    await prefs.remove(AppConfig.prefsUserKey);
    _client.token = null;
    notifyListeners();
  }

  Future<void> refreshAppointments() async {
    if (!isAuthenticated) return;
    try {
      final items = await _appointmentRepository.list(status: 'all');
      _detectNewRequests(items);
      _appointments = items;
      _error = null;
      notifyListeners();
    } on ApiException catch (e) {
      _error = e.message;
      notifyListeners();
    } catch (_) {
      _error = 'Sem conexão com a API. Verifique se ela está rodando (npm run dev).';
      notifyListeners();
    }
  }

  /// Compara a fila recém-carregada com os IDs pendentes já conhecidos para
  /// detectar novas solicitações chegadas via MOM (sem ação do barbeiro).
  void _detectNewRequests(List<BarberAppointment> items) {
    final currentPending = items.where((a) => a.isActionable).toList();
    final currentPendingIds = currentPending.map((a) => a.id).toSet();

    if (_firstLoadDone) {
      for (final appt in currentPending) {
        if (!_knownPendingIds.contains(appt.id)) {
          _newRequestAlerts.add(appt);
        }
      }
    }

    _knownPendingIds
      ..clear()
      ..addAll(currentPendingIds);
    _firstLoadDone = true;
  }

  /// Retorna e limpa os alertas de novas solicitações (consumidos pela UI).
  List<BarberAppointment> takeNewRequestAlerts() {
    if (_newRequestAlerts.isEmpty) return const [];
    final copy = List<BarberAppointment>.from(_newRequestAlerts);
    _newRequestAlerts.clear();
    return copy;
  }

  Future<bool> confirmAppointment(String id) async {
    return _mutate(() => _appointmentRepository.confirm(id));
  }

  Future<bool> rejectAppointment(String id) async {
    return _mutate(() => _appointmentRepository.reject(id));
  }

  Future<bool> _mutate(Future<BarberAppointment> Function() action) async {
    _setLoading(true);
    try {
      await action();
      await refreshAppointments();
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      notifyListeners();
      return false;
    } finally {
      _setLoading(false);
    }
  }

  BarberAppointment? findById(String id) {
    try {
      return _appointments.firstWhere((a) => a.id == id);
    } catch (_) {
      return null;
    }
  }

  void startPolling() {
    if (_pollingEnabled) return;
    _pollingEnabled = true;
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(
      const Duration(seconds: AppConfig.pollingIntervalSeconds),
      (_) => refreshAppointments(),
    );
    notifyListeners();
  }

  void stopPolling() {
    _pollingEnabled = false;
    _pollTimer?.cancel();
    _pollTimer = null;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  void _setLoading(bool value) {
    _loading = value;
    notifyListeners();
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }
}
