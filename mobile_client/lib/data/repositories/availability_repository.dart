import '../../models/availability_slot.dart';
import '../api/api_client.dart';

class AvailabilityRepository {
  AvailabilityRepository(this._client);

  final ApiClient _client;

  Future<BarberAvailability> getSlots({required String barberId, required String date}) async {
    final json = await _client.get('/api/v1/availability/available-slots', query: {
      'barberId': barberId,
      'date': date,
    });
    return BarberAvailability.fromJson(json);
  }
}
