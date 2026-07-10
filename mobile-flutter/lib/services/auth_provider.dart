import 'dart:convert';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _sellerKey = 'snapy_seller';
const _buyerKey = 'snapy_buyer_id';

class SellerAuth {
  final String token;
  final String phone;
  final String maskedPhone;
  final String storeName;

  SellerAuth({required this.token, required this.phone, required this.maskedPhone, required this.storeName});

  factory SellerAuth.fromJson(Map<String, dynamic> j) => SellerAuth(
        token: j['token'] as String,
        phone: j['phone'] as String,
        maskedPhone: j['maskedPhone'] as String,
        storeName: (j['storeName'] as String?) ?? '',
      );

  Map<String, dynamic> toJson() => {'token': token, 'phone': phone, 'maskedPhone': maskedPhone, 'storeName': storeName};

  SellerAuth copyWith({String? storeName}) =>
      SellerAuth(token: token, phone: phone, maskedPhone: maskedPhone, storeName: storeName ?? this.storeName);
}

class AuthProvider extends ChangeNotifier {
  SellerAuth? _auth;
  bool _ready = false;

  SellerAuth? get auth => _auth;
  bool get ready => _ready;

  AuthProvider() {
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_sellerKey);
    if (raw != null) {
      try {
        _auth = SellerAuth.fromJson(jsonDecode(raw) as Map<String, dynamic>);
      } catch (_) {
        _auth = null;
      }
    }
    _ready = true;
    notifyListeners();
  }

  Future<void> setAuth(SellerAuth? next) async {
    _auth = next;
    final prefs = await SharedPreferences.getInstance();
    if (next != null) {
      await prefs.setString(_sellerKey, jsonEncode(next.toJson()));
    } else {
      await prefs.remove(_sellerKey);
    }
    notifyListeners();
  }

  Future<void> patchStoreName(String storeName) async {
    if (_auth == null) return;
    await setAuth(_auth!.copyWith(storeName: storeName));
  }

  static Future<String> getBuyerId() async {
    final prefs = await SharedPreferences.getInstance();
    var id = prefs.getString(_buyerKey);
    if (id == null) {
      final rand = Random();
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      id = 'Acheteur-${List.generate(4, (_) => chars[rand.nextInt(chars.length)]).join().toUpperCase()}';
      await prefs.setString(_buyerKey, id);
    }
    return id;
  }
}
