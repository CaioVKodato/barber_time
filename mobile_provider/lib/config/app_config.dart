import 'dart:io';

/// URL base da API BarberTime (compartilhada com o app cliente).
/// - Emulador Android: 10.0.2.2 aponta para localhost do PC.
/// - Windows/Web/iOS simulador: localhost.
/// - Celular físico: use o IP da máquina (ex.: http://192.168.0.10:3000).
class AppConfig {
  static const defaultApiBaseUrl = 'http://10.0.2.2:3000';

  /// Intervalo de polling da fila do barbeiro. Como o prestador precisa ver
  /// novas solicitações rapidamente, usamos um intervalo mais curto que o app
  /// cliente.
  static const pollingIntervalSeconds = 8;
  static const httpTimeoutSeconds = 15;
  static const prefsApiUrlKey = 'api_base_url';
  static const prefsTokenKey = 'auth_token';
  static const prefsUserKey = 'auth_user';

  static String defaultBaseUrlForPlatform() {
    if (Platform.isAndroid) return defaultApiBaseUrl;
    return 'http://localhost:3000';
  }
}
