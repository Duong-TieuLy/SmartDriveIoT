class User {
  final int id;
  final String email;
  final String fullName;
  final String role;

  User({
    required this.id,
    required this.email,
    required this.fullName,
    required this.role,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as int,
      email: json['email'] as String,
      fullName: json['fullName'] as String,
      role: (json['role'] as String? ?? 'user').toLowerCase(),
    );
  }

  factory User.fromJwtClaims(Map<String, dynamic> claims) {
    return User(
      id: claims['userId'] as int? ?? 0,
      email: claims['sub'] as String? ?? '',
      fullName: claims['fullName'] as String? ?? claims['name'] as String? ?? 'Người dùng',
      role: (claims['role'] as String? ?? 'user').toLowerCase(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'fullName': fullName,
      'role': role,
    };
  }
}
