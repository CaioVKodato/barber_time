class Barber {
  const Barber({
    required this.id,
    required this.fullName,
    required this.active,
  });

  final String id;
  final String fullName;
  final bool active;

  factory Barber.fromJson(Map<String, dynamic> json) {
    return Barber(
      id: json['id'] as String,
      fullName: json['fullName'] as String,
      active: json['active'] as bool? ?? true,
    );
  }
}
