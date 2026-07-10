import 'dart:convert';
import 'dart:math';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'api.dart';

const _storageKey = 'snapy_seller';
const _buyerKey = 'snapy_buyer_id';

class AuthProvider extends ChangeNotifier {
  AuthData? _auth;
  bool _ready = false;

  AuthData? get auth => _auth;
  bool get ready => _ready;

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_storageKey);
    if (raw != null) {
      try {
        _auth = AuthData.fromJson(jsonDecode(raw));
      } catch (_) {
        _auth = null;
      }
    }
    _ready = true;
    notifyListeners();
  }

  Future<void> setAuth(AuthData? next) async {
    _auth = next;
    final prefs = await SharedPreferences.getInstance();
    if (next != null) {
      await prefs.setString(_storageKey, jsonEncode(next.toJson()));
    } else {
      await prefs.remove(_storageKey);
    }
    notifyListeners();
  }

  Future<void> patchStoreName(String storeName) async {
    if (_auth == null) return;
    _auth = _auth!.copyWith(storeName: storeName);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_storageKey, jsonEncode(_auth!.toJson()));
    notifyListeners();
  }
}

String? _cachedBuyerId;

Future<String> getBuyerId() async {
  if (_cachedBuyerId != null) return _cachedBuyerId!;
  final prefs = await SharedPreferences.getInstance();
  var id = prefs.getString(_buyerKey);
  if (id == null) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    final rand = Random();
    final suffix = List.generate(4, (_) => chars[rand.nextInt(chars.length)]).join().toUpperCase();
    id = 'Acheteur-$suffix';
    await prefs.setString(_buyerKey, id);
  }
  _cachedBuyerId = id;
  return id;
}
