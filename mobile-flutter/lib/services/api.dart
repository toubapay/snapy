import 'dart:convert';
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:http/http.dart' as http;

class ApiException implements Exception {
  final String message;
  final int status;
  ApiException(this.message, this.status);
  @override
  String toString() => message;
}

class Api {
  Api._();
  static final Api instance = Api._();

  // Android emulator can't reach the host machine via "localhost" — it maps
  // 10.0.2.2 to the host instead. iOS simulator, web, and Windows desktop
  // share the host's localhost directly. Physical devices need the host's
  // LAN IP (printed by the backend on startup) passed via --dart-define=API_BASE_URL=...
  static String get base {
    const override = String.fromEnvironment('API_BASE_URL');
    if (override.isNotEmpty) return override;
    if (!kIsWeb && Platform.isAndroid) return 'http://10.0.2.2:4000';
    return 'http://localhost:4000';
  }

  Future<dynamic> _request(
    String path, {
    String method = 'GET',
    String? token,
    Map<String, dynamic>? json,
    Map<String, String>? fields,
    http.MultipartFile? file,
  }) async {
    final uri = Uri.parse('$base$path');
    http.Response res;

    if (file != null) {
      final req = http.MultipartRequest(method, uri);
      if (token != null) req.headers['Authorization'] = 'Bearer $token';
      if (fields != null) req.fields.addAll(fields);
      req.files.add(file);
      final streamed = await req.send();
      res = await http.Response.fromStream(streamed);
    } else {
      final headers = <String, String>{};
      if (token != null) headers['Authorization'] = 'Bearer $token';
      if (json != null) headers['Content-Type'] = 'application/json';
      switch (method) {
        case 'POST':
          res = await http.post(uri, headers: headers, body: json != null ? jsonEncode(json) : null);
          break;
        case 'PATCH':
          res = await http.patch(uri, headers: headers, body: json != null ? jsonEncode(json) : null);
          break;
        case 'DELETE':
          res = await http.delete(uri, headers: headers);
          break;
        default:
          res = await http.get(uri, headers: headers);
      }
    }

    if (res.statusCode == 204) return null;

    Map<String, dynamic> data = {};
    dynamic decoded;
    try {
      decoded = jsonDecode(utf8.decode(res.bodyBytes));
    } catch (_) {
      decoded = null;
    }
    if (decoded is Map<String, dynamic>) data = decoded;

    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw ApiException(data['error'] as String? ?? 'Une erreur s\'est produite.', res.statusCode);
    }
    return decoded;
  }

  Future<Map<String, dynamic>> register(String phone, String pin, String storeName) async {
    final data = await _request('/api/sellers/register', method: 'POST', json: {'phone': phone, 'pin': pin, 'storeName': storeName});
    return data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> login(String phone, String pin) async {
    final data = await _request('/api/sellers/login', method: 'POST', json: {'phone': phone, 'pin': pin});
    return data as Map<String, dynamic>;
  }

  Future<void> logout(String token) => _request('/api/sellers/logout', method: 'POST', token: token);

  Future<Map<String, dynamic>> me(String token) async {
    final data = await _request('/api/sellers/me', token: token);
    return data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> updateProfile(String token, Map<String, dynamic> body) async {
    final data = await _request('/api/sellers/me', method: 'PATCH', token: token, json: body);
    return data as Map<String, dynamic>;
  }

  Future<void> deleteAccount(String token) => _request('/api/sellers/me', method: 'DELETE', token: token);

  Future<List<dynamic>> products({String? seller, String? category, String? sort}) async {
    final params = <String, String>{};
    if (seller != null) params['seller'] = seller;
    if (category != null) params['category'] = category;
    if (sort != null) params['sort'] = sort;
    final qs = params.isEmpty ? '' : '?${Uri(queryParameters: params).query}';
    final data = await _request('/api/products$qs');
    return data as List<dynamic>;
  }

  Future<List<dynamic>> myProducts(String token) async {
    final data = await _request('/api/products/mine', token: token);
    return data as List<dynamic>;
  }

  Future<Map<String, dynamic>> createProduct(String token, String name, String category, http.MultipartFile image) async {
    final data = await _request(
      '/api/products',
      method: 'POST',
      token: token,
      fields: {'name': name, 'category': category},
      file: image,
    );
    return data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> updateProduct(String token, String id, String name, String category, http.MultipartFile? image) async {
    final data = await _request(
      '/api/products/$id',
      method: 'PATCH',
      token: token,
      fields: {'name': name, 'category': category},
      file: image,
    );
    return data as Map<String, dynamic>;
  }

  Future<void> deleteProduct(String token, String id) => _request('/api/products/$id', method: 'DELETE', token: token);

  Future<List<dynamic>> categories() async {
    final data = await _request('/api/products/categories');
    return data as List<dynamic>;
  }

  Future<Map<String, dynamic>> chat(String productId) async {
    final data = await _request('/api/chats/$productId');
    return data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> sendChat(String productId, String senderId, String text) async {
    final data = await _request('/api/chats/$productId', method: 'POST', json: {'senderId': senderId, 'text': text});
    return data as Map<String, dynamic>;
  }
}
