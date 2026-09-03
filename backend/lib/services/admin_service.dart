import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:mysql1/mysql1.dart';
import '../models/admin_model.dart';

String _sha256(String input) =>
    sha256.convert(utf8.encode(input)).toString();

class AdminService {
  final MySqlConnection connection;

  AdminService(this.connection);

  Future<Admin?> login(String emailAddress, String password) async {
    final result = await connection.query(
      'SELECT * FROM admin_users WHERE email_address = ?',
      [emailAddress],
    );

    if (result.isEmpty) return null;

    final row = result.first;
    final stored = row['password'] as String;

    // Passwords are stored as SHA2-256 hex strings
    if (stored != _sha256(password)) return null;

    return Admin(
      adminId: row['admin_id'] as int,
      fullname: row['fullname'] as String,
      emailAddress: row['email_address'] as String,
      password: '',
    );
  }
}
