import 'package:intl/intl.dart';
import 'package:timezone/data/latest.dart' as tzdata;
import 'package:timezone/timezone.dart' as tz;

/// Formatação de datas/horas SEMPRE no fuso da barbearia (America/Sao_Paulo),
/// independentemente do fuso do aparelho/emulador.
class AppTime {
  static const String zoneName = 'America/Sao_Paulo';
  static late tz.Location _location;

  /// Deve ser chamado uma vez no start do app.
  static void init() {
    tzdata.initializeTimeZones();
    _location = tz.getLocation(zoneName);
  }

  /// Converte um instante (normalmente UTC) para o horário de parede de São Paulo.
  static tz.TZDateTime toBarberZone(DateTime instant) {
    return tz.TZDateTime.from(instant, _location);
  }

  /// Formata um instante no fuso da barbearia usando o padrão informado.
  static String format(DateTime instant, String pattern) {
    return DateFormat(pattern, 'pt_BR').format(toBarberZone(instant));
  }

  /// `agora` no fuso da barbearia (para comparar se um horário já passou).
  static tz.TZDateTime now() => tz.TZDateTime.now(_location);
}
