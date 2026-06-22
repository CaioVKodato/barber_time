import 'dart:convert';

import 'package:http/http.dart' as http;

import '../../config/app_config.dart';
import '../../core/errors/api_exception.dart';

class ApiClient {
  ApiClient({required this.baseUrl, this.token});

  final String baseUrl;
  String? token;

  static final _timeout = Duration(seconds: AppConfig.httpTimeoutSeconds);

  Uri _uri(String path, [Map<String, String>? query]) {
    final normalized = baseUrl.endsWith('/') ? baseUrl.substring(0, baseUrl.length - 1) : baseUrl;
    return Uri.parse('$normalized$path').replace(queryParameters: query);
  }

  Map<String, String> _headers({bool auth = false}) {
    final headers = <String, String>{'Content-Type': 'application/json'};
    if (auth && token != null && token!.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  Future<Map<String, dynamic>> get(String path, {Map<String, String>? query, bool auth = false}) async {
    final response = await http.get(_uri(path, query), headers: _headers(auth: auth)).timeout(_timeout);
    return _decode(response);
  }

  Future<Map<String, dynamic>> post(String path, Map<String, dynamic> body, {bool auth = false}) async {
    final response = await http
        .post(
          _uri(path),
          headers: _headers(auth: auth),
          body: jsonEncode(body),
        )
        .timeout(_timeout);
    return _decode(response);
  }

  Future<Map<String, dynamic>> patch(String path, [Map<String, dynamic>? body, bool auth = false]) async {
    final response = await http
        .patch(
          _uri(path),
          headers: _headers(auth: auth),
          body: body == null ? null : jsonEncode(body),
        )
        .timeout(_timeout);
    return _decode(response);
  }

  Map<String, dynamic> _decode(http.Response response) {
    Map<String, dynamic>? jsonBody;
    if (response.body.isNotEmpty) {
      final decoded = jsonDecode(response.body);
      if (decoded is Map<String, dynamic>) jsonBody = decoded;
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonBody ?? {};
    }

    final message = jsonBody?['error'] as String? ?? 'Erro HTTP ${response.statusCode}';
    throw ApiException(message, statusCode: response.statusCode);
  }
}
