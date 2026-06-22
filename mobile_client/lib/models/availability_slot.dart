class AvailabilitySlot {
  const AvailabilitySlot({
    required this.startsAt,
    required this.endsAt,
  });

  final DateTime startsAt;
  final DateTime endsAt;

  factory AvailabilitySlot.fromJson(Map<String, dynamic> json) {
    return AvailabilitySlot(
      startsAt: DateTime.parse(json['startsAt'] as String),
      endsAt: DateTime.parse(json['endsAt'] as String),
    );
  }
}

class BarberAvailability {
  const BarberAvailability({
    required this.barberId,
    required this.barberName,
    required this.date,
    required this.closedToday,
    required this.slots,
  });

  final String barberId;
  final String barberName;
  final String date;
  final bool closedToday;
  final List<AvailabilitySlot> slots;

  factory BarberAvailability.fromJson(Map<String, dynamic> json) {
    final rawSlots = json['availableSlots'] as List<dynamic>? ?? [];
    return BarberAvailability(
      barberId: json['barberId'] as String,
      barberName: json['barberName'] as String,
      date: json['date'] as String,
      closedToday: json['closedToday'] as bool? ?? false,
      slots: rawSlots
          .map((e) => AvailabilitySlot.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}
