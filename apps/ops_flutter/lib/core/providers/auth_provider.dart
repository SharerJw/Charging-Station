import 'dart:async';
import 'package:flutter/material.dart';
import 'package:ops_flutter/core/network/api_client.dart';
import 'package:ops_flutter/core/network/api_endpoints.dart';
import 'package:ops_flutter/core/storage/storage_service.dart';
import 'package:ops_flutter/shared/models/user.dart';

/// Authentication state manager using ChangeNotifier.
class AuthProvider extends ChangeNotifier {
  final StorageService _storage;

  User? _currentUser;
  bool _isLoading = false;
  String? _error;

  AuthProvider(this._storage);

  // ── Getters ──────────────────────────────────────────────────

  User? get currentUser => _currentUser;
  bool get isAuthenticated => _currentUser != null;
  bool get isLoading => _isLoading;
  String? get error => _error;

  /// Convenience display name.
  String get displayName => _currentUser?.realName ?? _currentUser?.username ?? '未登录';

  // ── Init ─────────────────────────────────────────────────────

  /// Try to restore a previously saved session.
  Future<bool> tryAutoLogin() async {
    final token = await _storage.getAccessToken();
    if (token == null || token.isEmpty) return false;

    try {
      final resp = await ApiClient.instance.get(ApiEndpoints.getUserInfo);
      if (resp.data is Map<String, dynamic>) {
        _currentUser = User.fromJson(resp.data as Map<String, dynamic>);
      }
      // Restore cached user as fallback.
      _currentUser ??= _storage.getUser();
      notifyListeners();
      return _currentUser != null;
    } catch (_) {
      // Token invalid – clear everything.
      await _storage.clearTokens();
      await _storage.clearUser();
      return false;
    }
  }

  // ── Login ────────────────────────────────────────────────────

  Future<bool> login({
    required String username,
    required String password,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final resp = await ApiClient.instance.post(
        ApiEndpoints.opsLogin,
        data: {
          'username': username,
          'password': password,
        },
      );

      final data = resp.data as Map<String, dynamic>?;
      if (data == null) {
        _error = '登录失败：未收到响应数据';
        _isLoading = false;
        notifyListeners();
        return false;
      }

      // Persist tokens.
      // 后端 LoginResp 只有 token 字段（_ResponseInterceptor 已解包 R 信封）
      final accessToken = data['token'] as String? ?? data['accessToken'] as String? ?? '';
      final refreshToken = data['refreshToken'] as String? ?? '';
      await _storage.saveTokens(
        accessToken: accessToken,
        refreshToken: refreshToken,
      );

      // Persist user info if returned inline.
      final userData = data['user'] as Map<String, dynamic>?;
      if (userData != null) {
        _currentUser = User.fromJson(userData);
        await _storage.saveUser(_currentUser!);
      }

      // Fetch full user profile.
      await tryAutoLogin();

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = _parseError(e);
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // ── Refresh Token ────────────────────────────────────────────

  Future<bool> refreshToken() async {
    final storedRefreshToken = await _storage.getRefreshToken();
    if (storedRefreshToken == null || storedRefreshToken.isEmpty) return false;

    try {
      final resp = await ApiClient.instance.post(
        ApiEndpoints.refreshToken,
        data: {'refreshToken': storedRefreshToken},
      );

      final data = resp.data as Map<String, dynamic>?;
      if (data != null) {
        final accessToken = data['token'] as String? ?? data['accessToken'] as String? ?? '';
        final refreshToken = data['refreshToken'] as String? ?? storedRefreshToken;
        await _storage.saveTokens(
          accessToken: accessToken,
          refreshToken: refreshToken,
        );
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  // ── Logout ───────────────────────────────────────────────────

  Future<void> logout() async {
    try {
      await ApiClient.instance.post(ApiEndpoints.logout);
    } catch (_) {
      // Best-effort – clear locally regardless.
    }
    _currentUser = null;
    await _storage.clearTokens();
    await _storage.clearUser();
    notifyListeners();
  }

  // ── Helpers ──────────────────────────────────────────────────

  String _parseError(Object e) {
    if (e is Exception) {
      return e.toString().replaceFirst('Exception: ', '');
    }
    return '未知错误，请稍后重试';
  }
}
