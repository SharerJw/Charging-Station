/// User model for the ops app.
class User {
  final int id;
  final String username;
  final String realName;
  final String phone;
  final String role;
  final String? avatar;
  final String? tenantId;
  final List<String> permissions;

  const User({
    required this.id,
    required this.username,
    required this.realName,
    required this.phone,
    required this.role,
    this.avatar,
    this.tenantId,
    this.permissions = const [],
  });

  factory User.fromJson(Map<String, dynamic> json) {
    // 后端 id 可能是 String 或 int
    final rawId = json['id'];
    final parsedId = rawId is int ? rawId : int.tryParse(rawId?.toString() ?? '') ?? 0;

    // 后端返回 roles (List)，取第一个作为主角色
    final roles = json['roles'];
    final role = roles is List && roles.isNotEmpty
        ? roles.first.toString()
        : (json['role'] as String? ?? '');

    return User(
      id: parsedId,
      username: json['username'] as String? ?? '',
      realName: json['nickname'] as String? ?? json['realName'] as String? ?? '',
      phone: json['phone'] as String? ?? '',
      role: role,
      avatar: json['avatar'] as String?,
      tenantId: json['tenantId'] as String?,
      permissions: (json['permissions'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'realName': realName,
      'phone': phone,
      'role': role,
      'avatar': avatar,
      'tenantId': tenantId,
      'permissions': permissions,
    };
  }

  User copyWith({
    int? id,
    String? username,
    String? realName,
    String? phone,
    String? role,
    String? avatar,
    String? tenantId,
    List<String>? permissions,
  }) {
    return User(
      id: id ?? this.id,
      username: username ?? this.username,
      realName: realName ?? this.realName,
      phone: phone ?? this.phone,
      role: role ?? this.role,
      avatar: avatar ?? this.avatar,
      tenantId: tenantId ?? this.tenantId,
      permissions: permissions ?? this.permissions,
    );
  }

  @override
  String toString() => 'User(id: $id, username: $username, realName: $realName)';
}
