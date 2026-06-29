import '../../models/barber_appointment.dart';
import '../api/api_client.dart';

/// Acesso às rotas do portal do barbeiro (Bearer + role `barber`).
class BarberAppointmentRepository {
  BarberAppointmentRepository(this._client);

  final ApiClient _client;

  /// `status`: pending | confirmed | all.
  Future<List<BarberAppointment>> list({String status = 'all'}) async {
    final json = await _client.get(
      '/api/v1/barber/appointments',
      query: {'status': status},
      auth: true,
    );
    final list = json['appointments'] as List<dynamic>? ?? [];
    return list
        .map((e) => BarberAppointment.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<BarberAppointment> confirm(String appointmentId) async {
    final json = await _client.patch(
      '/api/v1/barber/appointments/$appointmentId/confirm',
      null,
      true,
    );
    return BarberAppointment.fromJson(json);
  }

  Future<BarberAppointment> reject(String appointmentId) async {
    final json = await _client.patch(
      '/api/v1/barber/appointments/$appointmentId/reject',
      null,
      true,
    );
    return BarberAppointment.fromJson(json);
  }
}
