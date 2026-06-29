import '../../models/auth_result.dart';
import '../api/api_client.dart';

class AuthRepository {
  AuthRepository(this._client);

  final ApiClient _client;

  Future<AuthResult> login(String email, String password) async {
    final json = await _client.post('/api/v1/auth/login', {
      'email': email,
      'password': password,
    });
    return AuthResult.fromJson(json);
  }
}
