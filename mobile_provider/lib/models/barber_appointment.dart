/// Solicitação de agendamento sob a ótica do prestador (barbeiro).
/// Espelha o payload de `GET /api/v1/barber/appointments`.
class BarberAppointment {
  const BarberAppointment({
    required this.id,
    required this.barberId,
    required this.barberName,
    required this.clientId,
    required this.clientFullName,
    required this.clientEmail,
    required this.startsAt,
    required this.endsAt,
    required this.status,
    required this.createdAt,
  });

  final String id;
  final String barberId;
  final String barberName;
  final String clientId;
  final String clientFullName;
  final String clientEmail;
  final DateTime startsAt;
  final DateTime endsAt;
  final String status;
  final DateTime createdAt;

  bool get isPending => status == 'pending';
  bool get isConfirmed => status == 'confirmed';
  bool get isCancelled => status == 'cancelled';

  /// O horário do atendimento já terminou?
  bool get isPast => endsAt.toLocal().isBefore(DateTime.now());

  /// Pode receber ação (aceitar/recusar): só pendentes que ainda não passaram.
  bool get isActionable => isPending && !isPast;

  /// Status efetivo considerando a passagem do tempo:
  /// confirmado + passado => concluído; pendente + passado => expirado.
  String get displayStatus {
    if (isCancelled) return 'cancelled';
    if (isPast) return isConfirmed ? 'completed' : 'expired';
    return status;
  }

  String get statusLabel => _labelFor(status);

  String get displayStatusLabel => _labelFor(displayStatus);

  static String _labelFor(String value) {
    switch (value) {
      case 'pending':
        return 'Aguardando sua resposta';
      case 'confirmed':
        return 'Confirmado';
      case 'cancelled':
        return 'Recusado/Cancelado';
      case 'completed':
        return 'Concluído';
      case 'expired':
        return 'Expirado';
      default:
        return value;
    }
  }

  factory BarberAppointment.fromJson(Map<String, dynamic> json) {
    return BarberAppointment(
      id: json['id'] as String,
      barberId: json['barberId'] as String? ?? '',
      barberName: json['barberName'] as String? ?? 'Barbeiro',
      clientId: json['clientId'] as String? ?? '',
      clientFullName: json['clientFullName'] as String? ?? 'Cliente',
      clientEmail: json['clientEmail'] as String? ?? '',
      startsAt: DateTime.parse(json['startsAt'] as String),
      endsAt: DateTime.parse(json['endsAt'] as String),
      status: json['status'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}
