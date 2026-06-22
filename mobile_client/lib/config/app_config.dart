import 'dart:io';

/// URL base da API BarberTime.
/// - Emulador Android: 10.0.2.2 aponta para localhost do PC.
/// - Windows/Web/iOS simulador: localhost.
/// - Celular físico: use o IP da máquina (ex.: http://192.168.0.10:3000).
class AppConfig {
  static const defaultApiBaseUrl = 'http://10.0.2.2:3000';
  static const pollingIntervalSeconds = 10;
  static const httpTimeoutSeconds = 15;
  static const prefsApiUrlKey = 'api_base_url';
  static const prefsTokenKey = 'auth_token';
  static const prefsUserKey = 'auth_user';

  static String defaultBaseUrlForPlatform() {
    if (Platform.isAndroid) return defaultApiBaseUrl;
    return 'http://localhost:3000';
  }
}
