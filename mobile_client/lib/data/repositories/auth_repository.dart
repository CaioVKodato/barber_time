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

  Future<AuthResult> register(String email, String password, String fullName) async {
    final json = await _client.post('/api/v1/auth/register', {
      'email': email,
      'password': password,
      'fullName': fullName,
    });
    return AuthResult.fromJson(json);
  }
}
