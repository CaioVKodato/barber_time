import '../../models/appointment.dart';
import '../api/api_client.dart';

class AppointmentRepository {
  AppointmentRepository(this._client);

  final ApiClient _client;

  Future<List<Appointment>> listMine() async {
    final json = await _client.get('/api/v1/appointments', auth: true);
    final list = json['appointments'] as List<dynamic>? ?? [];
    return list.map((e) => Appointment.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Appointment> create({required String barberId, required DateTime startsAt}) async {
    final json = await _client.post('/api/v1/appointments', {
      'barberId': barberId,
      'startsAt': startsAt.toIso8601String(),
    }, auth: true);
    return Appointment.fromJson(json);
  }

  Future<Appointment> cancel(String appointmentId) async {
    final json = await _client.patch('/api/v1/appointments/$appointmentId/cancel', null, true);
    return Appointment.fromJson(json);
  }
}
