import '../../models/barber.dart';
import '../api/api_client.dart';

class BarberRepository {
  BarberRepository(this._client);

  final ApiClient _client;

  Future<List<Barber>> listActive() async {
    final json = await _client.get('/api/v1/barbers');
    final list = json['barbers'] as List<dynamic>? ?? [];
    return list.map((e) => Barber.fromJson(e as Map<String, dynamic>)).toList();
  }
}
