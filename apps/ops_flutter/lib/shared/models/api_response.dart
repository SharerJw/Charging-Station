/// Generic API response wrapper.
class ApiResponse<T> {
  final int code;
  final String message;
  final T? data;

  const ApiResponse({
    required this.code,
    required this.message,
    this.data,
  });

  bool get isSuccess => code == 0;

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(dynamic)? fromData,
  ) {
    return ApiResponse(
      code: json['code'] as int? ?? -1,
      message: json['message'] as String? ?? '',
      data: json['data'] != null && fromData != null
          ? fromData(json['data'])
          : json['data'] as T?,
    );
  }

  Map<String, dynamic> toJson(Map<String, dynamic> Function(T)? toData) {
    return {
      'code': code,
      'message': message,
      'data': data != null && toData != null ? toData(data as T) : data,
    };
  }

  @override
  String toString() => 'ApiResponse(code: $code, message: $message, data: $data)';
}

/// Paginated list response wrapper.
class PaginatedResponse<T> {
  final List<T> records;
  final int total;
  final int page;
  final int size;

  const PaginatedResponse({
    required this.records,
    required this.total,
    required this.page,
    required this.size,
  });

  int get totalPages => (total / size).ceil();
  bool get hasMore => page < totalPages;

  factory PaginatedResponse.fromJson(
    Map<String, dynamic> json,
    T Function(Map<String, dynamic>) fromItem,
  ) {
    final list = (json['records'] as List<dynamic>?)
            ?.map((e) => fromItem(e as Map<String, dynamic>))
            .toList() ??
        [];
    return PaginatedResponse(
      records: list,
      total: json['total'] as int? ?? 0,
      page: json['page'] as int? ?? 1,
      size: json['size'] as int? ?? 20,
    );
  }
}
