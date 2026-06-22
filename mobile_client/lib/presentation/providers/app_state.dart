import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../config/app_config.dart';
import '../../core/errors/api_exception.dart';
import '../../data/api/api_client.dart';
import '../../data/repositories/appointment_repository.dart';
import '../../data/repositories/auth_repository.dart';
import '../../data/repositories/availability_repository.dart';
import '../../data/repositories/barber_repository.dart';
import '../../models/appointment.dart';
import '../../models/auth_result.dart';
import '../../models/availability_slot.dart';
import '../../models/barber.dart';
import '../../models/user.dart';

class AppState extends ChangeNotifier {
  AppState();

  late ApiClient _client;
  late AuthRepository _authRepository;
  late AppointmentRepository _appointmentRepository;
  late BarberRepository _barberRepository;
  late AvailabilityRepository _availabilityRepository;

  String _apiBaseUrl = AppConfig.defaultBaseUrlForPlatform();
  String? _token;
  User? _user;
  List<Appointment> _appointments = [];
  bool _loading = false;
  String? _error;
  Timer? _pollTimer;
  bool _pollingEnabled = false;
  bool _bootstrapped = false;

  String get apiBaseUrl => _apiBaseUrl;
  User? get user => _user;
  List<Appointment> get appointments => List.unmodifiable(_appointments);

  /// Próximos: ainda não aconteceram (ordenados do mais cedo ao mais tarde).
  List<Appointment> get upcomingAppointments {
    final items = _appointments.where((a) => !a.isPast).toList()
      ..sort((a, b) => a.startsAt.compareTo(b.startsAt));
    return List.unmodifiable(items);
  }

  /// Histórico: já aconteceram (mais recentes primeiro).
  List<Appointment> get pastAppointments {
    final items = _appointments.where((a) => a.isPast).toList()
      ..sort((a, b) => b.startsAt.compareTo(a.startsAt));
    return List.unmodifiable(items);
  }
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
    // Carrega prefs e sessão em background — não bloqueia runApp().
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
    _appointmentRepository = AppointmentRepository(_client);
    _barberRepository = BarberRepository(_client);
    _availabilityRepository = AvailabilityRepository(_client);
  }

  Future<void> setApiBaseUrl(String url) async {
    final trimmed = url.trim().replaceAll(RegExp(r'/$'), '');
    _apiBaseUrl = trimmed.isEmpty ? AppConfig.defaultBaseUrlForPlatform() : trimmed;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConfig.prefsApiUrlKey, _apiBaseUrl);
    _client = ApiClient(baseUrl: _apiBaseUrl, token: _token);
    _authRepository = AuthRepository(_client);
    _appointmentRepository = AppointmentRepository(_client);
    _barberRepository = BarberRepository(_client);
    _availabilityRepository = AvailabilityRepository(_client);
    notifyListeners();
  }

  Future<void> login(String email, String password) async {
    await _authenticate(() => _authRepository.login(email, password));
  }

  Future<void> register(String email, String password, String fullName) async {
    await _authenticate(() => _authRepository.register(email, password, fullName));
  }

  Future<void> _authenticate(Future<AuthResult> Function() action) async {
    _setLoading(true);
    try {
      final result = await action();
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
    } finally {
      _setLoading(false);
    }
  }

  Future<void> logout() async {
    stopPolling();
    _token = null;
    _user = null;
    _appointments = [];
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(AppConfig.prefsTokenKey);
    await prefs.remove(AppConfig.prefsUserKey);
    _client.token = null;
    notifyListeners();
  }

  Future<void> refreshAppointments() async {
    if (!isAuthenticated) return;
    try {
      final items = await _appointmentRepository.listMine();
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

  Future<Appointment?> createAppointment({
    required String barberId,
    required DateTime startsAt,
  }) async {
    _setLoading(true);
    try {
      final created = await _appointmentRepository.create(
        barberId: barberId,
        startsAt: startsAt,
      );
      await refreshAppointments();
      return created;
    } on ApiException catch (e) {
      _error = e.message;
      notifyListeners();
      return null;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> cancelAppointment(String id) async {
    _setLoading(true);
    try {
      await _appointmentRepository.cancel(id);
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

  Future<List<Barber>> loadBarbers() async {
    try {
      return await _barberRepository.listActive();
    } on ApiException catch (e) {
      _error = e.message;
      notifyListeners();
      rethrow;
    }
  }

  Future<BarberAvailability> loadAvailability({
    required String barberId,
    required String date,
  }) async {
    try {
      return await _availabilityRepository.getSlots(barberId: barberId, date: date);
    } on ApiException catch (e) {
      _error = e.message;
      notifyListeners();
      rethrow;
    }
  }

  Appointment? findById(String id) {
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
