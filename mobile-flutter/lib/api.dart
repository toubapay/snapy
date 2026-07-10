import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

// Android emulator can't reach the host machine via "localhost" — it maps
// 10.0.2.2 to the host instead. iOS simulator/desktop share the host's
// localhost directly. Physical devices need the host's LAN IP, overridable
// via --dart-define=API_BASE_URL=http://<lan-ip>:4000 (see backend startup
// log for the LAN URL).
String _defaultBase() {
  if (kIsWeb) return 'http://localhost:4000';
  if (Platform.isAndroid) return 'http://10.0.2.2:4000';
  return 'http://localhost:4000';
}

const _envBase = String.fromEnvironment('API_BASE_URL');

class ApiError implements Exception {
  final String message;
  final int status;
  ApiError(this.message, this.status);

  @override
  String toString() => message;
}

class Product {
  final String id;
  final String name;
  final String category;
  final String imageUrl;
  final String? audioUrl;
  final String description;
  final String vendorId;
  final String storeName;
  final String ownerLabel;
  final String sellerPhone;
  final String contact;
  final int createdAt;
  final int updatedAt;

  Product({
    required this.id,
    required this.name,
    required this.category,
    required this.imageUrl,
    this.audioUrl,
    required this.description,
    required this.vendorId,
    required this.storeName,
    required this.ownerLabel,
    required this.sellerPhone,
    required this.contact,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Product.fromJson(Map<String, dynamic> json) => Product(
        id: json['id'],
        name: json['name'],
        category: json['category'] ?? '',
        imageUrl: json['imageUrl'],
        audioUrl: json['audioUrl'],
        description: json['description'] ?? '',
        vendorId: json['vendorId'] ?? '',
        storeName: json['storeName'] ?? '',
        ownerLabel: json['ownerLabel'] ?? '',
        sellerPhone: json['sellerPhone'] ?? '',
        contact: json['contact'] ?? '',
        createdAt: json['createdAt'] ?? 0,
        updatedAt: json['updatedAt'] ?? 0,
      );

  String absoluteImageUrl(String base) => imageUrl.startsWith('http') ? imageUrl : '$base$imageUrl';

  String? absoluteAudioUrl(String base) {
    if (audioUrl == null || audioUrl!.isEmpty) return null;
    return audioUrl!.startsWith('http') ? audioUrl : '$base$audioUrl';
  }
}

class Category {
  final String name;
  final int count;
  Category({required this.name, required this.count});

  factory Category.fromJson(Map<String, dynamic> json) => Category(name: json['name'], count: json['count'] ?? 0);
}

class ChatMessage {
  final String id;
  final String senderId;
  final String role;
  final String text;
  final int createdAt;

  ChatMessage({required this.id, required this.senderId, required this.role, required this.text, required this.createdAt});

  factory ChatMessage.fromJson(Map<String, dynamic> json) => ChatMessage(
        id: json['id'],
        senderId: json['senderId'],
        role: json['role'],
        text: json['text'],
        createdAt: json['createdAt'] ?? 0,
      );
}

class ChatThread {
  final String productId;
  final String productName;
  final String sellerVendorId;
  final List<ChatMessage> messages;

  ChatThread({required this.productId, required this.productName, required this.sellerVendorId, required this.messages});

  factory ChatThread.fromJson(Map<String, dynamic> json) => ChatThread(
        productId: json['productId'],
        productName: json['productName'],
        sellerVendorId: json['sellerVendorId'],
        messages: (json['messages'] as List).map((m) => ChatMessage.fromJson(m)).toList(),
      );
}

class AuthData {
  final String token;
  final String phone;
  final String maskedPhone;
  final String storeName;

  AuthData({required this.token, required this.phone, required this.maskedPhone, required this.storeName});

  factory AuthData.fromJson(Map<String, dynamic> json) => AuthData(
        token: json['token'],
        phone: json['phone'],
        maskedPhone: json['maskedPhone'] ?? '',
        storeName: json['storeName'] ?? '',
      );

  Map<String, dynamic> toJson() => {'token': token, 'phone': phone, 'maskedPhone': maskedPhone, 'storeName': storeName};

  AuthData copyWith({String? storeName}) => AuthData(
        token: token,
        phone: phone,
        maskedPhone: maskedPhone,
        storeName: storeName ?? this.storeName,
      );
}

class Api {
  static final String base = _envBase.isNotEmpty ? _envBase : _defaultBase();

  static Future<dynamic> _request(
    String path, {
    String method = 'GET',
    String? token,
    Map<String, dynamic>? json,
    http.MultipartRequest? multipart,
  }) async {
    final uri = Uri.parse('$base$path');
    http.Response res;

    if (multipart != null) {
      multipart.method = method;
      if (token != null) multipart.headers['Authorization'] = 'Bearer $token';
      final client = http.Client();
      try {
        final streamed = await client.send(multipart);
        res = await http.Response.fromStream(streamed);
      } finally {
        client.close();
      }
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

    dynamic data;
    try {
      data = res.body.isEmpty ? null : jsonDecode(res.body);
    } catch (_) {
      data = null;
    }

    if (res.statusCode < 200 || res.statusCode >= 300) {
      final message = (data is Map && data['error'] != null) ? data['error'] as String : 'Une erreur s\'est produite.';
      throw ApiError(message, res.statusCode);
    }
    return data;
  }

  static Future<AuthData> register(String phone, String pin, String storeName) async {
    final data = await _request('/api/sellers/register', method: 'POST', json: {'phone': phone, 'pin': pin, 'storeName': storeName});
    return AuthData.fromJson(data);
  }

  static Future<AuthData> login(String phone, String pin) async {
    final data = await _request('/api/sellers/login', method: 'POST', json: {'phone': phone, 'pin': pin});
    return AuthData.fromJson(data);
  }

  static Future<void> logout(String token) => _request('/api/sellers/logout', method: 'POST', token: token);

  static Future<Map<String, dynamic>> me(String token) async => await _request('/api/sellers/me', token: token);

  static Future<Map<String, dynamic>> updateProfile(String token, Map<String, dynamic> body) async =>
      await _request('/api/sellers/me', method: 'PATCH', token: token, json: body);

  static Future<void> deleteAccount(String token) => _request('/api/sellers/me', method: 'DELETE', token: token);

  static Future<List<Product>> products({String? sort, String? seller, String? category}) async {
    final qs = <String, String>{};
    if (sort != null) qs['sort'] = sort;
    if (seller != null) qs['seller'] = seller;
    if (category != null) qs['category'] = category;
    final path = qs.isEmpty ? '/api/products' : '/api/products?${Uri(queryParameters: qs).query}';
    final data = await _request(path);
    return (data as List).map((p) => Product.fromJson(p)).toList();
  }

  static Future<List<Product>> myProducts(String token) async {
    final data = await _request('/api/products/mine', token: token);
    return (data as List).map((p) => Product.fromJson(p)).toList();
  }

  static Future<List<Category>> categories() async {
    final data = await _request('/api/products/categories');
    return (data as List).map((c) => Category.fromJson(c)).toList();
  }

  static Future<Product> createProduct(String token, {required String name, required String category, required File image, File? audio}) async {
    final req = http.MultipartRequest('POST', Uri.parse('$base/api/products'));
    req.fields['name'] = name;
    req.fields['category'] = category;
    req.files.add(await http.MultipartFile.fromPath('image', image.path));
    if (audio != null) req.files.add(await http.MultipartFile.fromPath('audio', audio.path));
    final data = await _request('/api/products', method: 'POST', token: token, multipart: req);
    return Product.fromJson(data);
  }

  static Future<Product> updateProduct(String token, String id, {required String name, required String category, File? image}) async {
    final req = http.MultipartRequest('PATCH', Uri.parse('$base/api/products/$id'));
    req.fields['name'] = name;
    req.fields['category'] = category;
    if (image != null) req.files.add(await http.MultipartFile.fromPath('image', image.path));
    final data = await _request('/api/products/$id', method: 'PATCH', token: token, multipart: req);
    return Product.fromJson(data);
  }

  static Future<void> deleteProduct(String token, String id) => _request('/api/products/$id', method: 'DELETE', token: token);

  static Future<ChatThread> chat(String productId) async {
    final data = await _request('/api/chats/$productId');
    return ChatThread.fromJson(data);
  }

  static Future<ChatMessage> sendChat(String productId, String senderId, String text) async {
    final data = await _request('/api/chats/$productId', method: 'POST', json: {'senderId': senderId, 'text': text});
    return ChatMessage.fromJson(data);
  }
}
