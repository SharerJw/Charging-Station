import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:ops_flutter/core/storage/storage_service.dart';

/// Centralized HTTP client built on Dio.
class ApiClient {
  // 手机和电脑需在同一局域网，将 localhost 替换为电脑 IP
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:8080',
  );

  static ApiClient? _instance;
  late final Dio _dio;

  ApiClient._internal(this._dio);

  static ApiClient get instance {
    if (_instance == null) {
      throw StateError('ApiClient not initialised. Call ApiClient.init() first.');
    }
    return _instance!;
  }

  /// Must be called once at app start.
  static Future<void> init({StorageService? storage}) async {
    final dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    dio.interceptors.addAll([
      _AuthInterceptor(storage),
      _LogInterceptor(),
      _ResponseInterceptor(),
    ]);

    _instance = ApiClient._internal(dio);
  }

  Dio get dio => _dio;

  // ── Convenience methods ──────────────────────────────────────

  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) {
    return _dio.get<T>(path, queryParameters: queryParameters, options: options);
  }

  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) {
    return _dio.post<T>(path, data: data, queryParameters: queryParameters, options: options);
  }

  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) {
    return _dio.put<T>(path, data: data, queryParameters: queryParameters, options: options);
  }

  Future<Response<T>> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) {
    return _dio.delete<T>(path, data: data, queryParameters: queryParameters, options: options);
  }
}

// ──────────────────────────────────────────────────────────────
// Interceptors
// ──────────────────────────────────────────────────────────────

/// Automatically injects the Bearer token into every request.
class _AuthInterceptor extends Interceptor {
  final StorageService? _storage;
  _AuthInterceptor(this._storage);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    if (_storage != null) {
      final token = await _storage.getAccessToken();
      if (token != null && token.isNotEmpty) {
        options.headers['Authorization'] = 'Bearer $token';
      }
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401 && _storage != null) {
      await _storage.clearTokens();
      // Signal to the auth provider to redirect to login.
      // The actual navigation is handled via a navigatorKey in the router.
    }
    handler.next(err);
  }
}

/// Lightweight request/response logger.
class _LogInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    debugPrint('[API] --> ${options.method} ${options.uri}');
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    debugPrint('[API] <-- ${response.statusCode} ${response.requestOptions.uri}');
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    debugPrint('[API] <-- ERROR ${err.response?.statusCode} ${err.requestOptions.uri}');
    handler.next(err);
  }
}

/// Unwraps the standard { code, data, message } envelope.
class _ResponseInterceptor extends Interceptor {
  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    // If the backend wraps responses in { code, data, message }, unwrap.
    if (response.data is Map<String, dynamic>) {
      final body = response.data as Map<String, dynamic>;
      final code = body['code'] as int?;
      if (code != null && code != 0) {
        final message = body['message'] as String? ?? 'Unknown error';
        handler.reject(
          DioException(
            requestOptions: response.requestOptions,
            response: response,
            type: DioExceptionType.badResponse,
            error: {'code': code, 'message': message},
            message: message,
          ),
        );
        return;
      }
      // Pass the unwrapped data forward.
      response.data = body['data'];
    }
    handler.next(response);
  }
}
