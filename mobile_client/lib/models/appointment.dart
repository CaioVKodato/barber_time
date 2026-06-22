class Appointment {
  const Appointment({
    required this.id,
    required this.barberId,
    required this.barberName,
    required this.startsAt,
    required this.endsAt,
    required this.status,
    required this.createdAt,
  });

  final String id;
  final String barberId;
  final String barberName;
  final DateTime startsAt;
  final DateTime endsAt;
  final String status;
  final DateTime createdAt;

  bool get isPending => status == 'pending';
  bool get isConfirmed => status == 'confirmed';
  bool get isCancelled => status == 'cancelled';

  /// O horário do agendamento já terminou?
  bool get isPast => endsAt.toLocal().isBefore(DateTime.now());

  /// Pertence ao histórico (já aconteceu e não foi cancelado).
  bool get isHistory => isPast && !isCancelled;

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
        return 'Aguardando confirmação';
      case 'confirmed':
        return 'Confirmado';
      case 'cancelled':
        return 'Cancelado';
      case 'completed':
        return 'Concluído';
      case 'expired':
        return 'Expirado';
      default:
        return value;
    }
  }

  factory Appointment.fromJson(Map<String, dynamic> json) {
    return Appointment(
      id: json['id'] as String,
      barberId: json['barberId'] as String,
      barberName: json['barberName'] as String? ?? 'Barbeiro',
      startsAt: DateTime.parse(json['startsAt'] as String),
      endsAt: DateTime.parse(json['endsAt'] as String),
      status: json['status'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}
