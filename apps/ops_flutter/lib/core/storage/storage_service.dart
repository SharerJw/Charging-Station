import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:ops_flutter/shared/models/user.dart';

/// Persistent storage service.
/// Uses SharedPreferences for general data and FlutterSecureStorage for tokens.
class StorageService {
  static const _keyAccessToken = 'access_token';
  static const _keyRefreshToken = 'refresh_token';
  static const _keyUserInfo = 'user_info';
  static const _keyFirstLaunch = 'first_launch';

  late final SharedPreferences _prefs;
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  /// Initialize – must be called before any other method.
  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  // ── Token ──────────────────────────────────────────────────────

  Future<void> saveAccessToken(String token) async {
    await _secureStorage.write(key: _keyAccessToken, value: token);
  }

  Future<String?> getAccessToken() async {
    return _secureStorage.read(key: _keyAccessToken);
  }

  Future<void> saveRefreshToken(String token) async {
    await _secureStorage.write(key: _keyRefreshToken, value: token);
  }

  Future<String?> getRefreshToken() async {
    return _secureStorage.read(key: _keyRefreshToken);
  }

  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await Future.wait([
      _secureStorage.write(key: _keyAccessToken, value: accessToken),
      _secureStorage.write(key: _keyRefreshToken, value: refreshToken),
    ]);
  }

  Future<void> clearTokens() async {
    await Future.wait([
      _secureStorage.delete(key: _keyAccessToken),
      _secureStorage.delete(key: _keyRefreshToken),
    ]);
  }

  // ── User Info ──────────────────────────────────────────────────

  Future<void> saveUser(User user) async {
    await _prefs.setString(_keyUserInfo, _userToString(user));
  }

  User? getUser() {
    final raw = _prefs.getString(_keyUserInfo);
    if (raw == null) return null;
    return _userFromString(raw);
  }

  Future<void> clearUser() async {
    await _prefs.remove(_keyUserInfo);
  }

  // ── General Prefs ─────────────────────────────────────────────

  Future<void> setString(String key, String value) async {
    await _prefs.setString(key, value);
  }

  String? getString(String key) => _prefs.getString(key);

  Future<void> setBool(String key, bool value) async {
    await _prefs.setBool(key, value);
  }

  bool getBool(String key) => _prefs.getBool(key) ?? false;

  Future<void> remove(String key) async {
    await _prefs.remove(key);
  }

  // ── First Launch ───────────────────────────────────────────────

  bool get isFirstLaunch => (_prefs.getBool(_keyFirstLaunch) ?? false) == false;

  Future<void> markLaunched() async {
    await _prefs.setBool(_keyFirstLaunch, true);
  }

  // ── Full Clear ─────────────────────────────────────────────────

  Future<void> clearAll() async {
    await _secureStorage.deleteAll();
    await _prefs.clear();
  }

  // ── Helpers ────────────────────────────────────────────────────

  /// Minimal JSON encode/decode to avoid pulling in dart:convert at module level.
  /// In production you would use jsonEncode / jsonDecode.
  String _userToString(User user) {
    final map = user.toJson();
    final parts = <String>[];
    for (final entry in map.entries) {
      final val = entry.value;
      parts.add('${entry.key}:${val ?? ''}');
    }
    return parts.join('|');
  }

  User _userFromString(String raw) {
    final map = <String, dynamic>{};
    for (final part in raw.split('|')) {
      final idx = part.indexOf(':');
      if (idx > 0) {
        map[part.substring(0, idx)] = part.substring(idx + 1);
      }
    }
    return User.fromJson(map);
  }
}
