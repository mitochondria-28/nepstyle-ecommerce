import 'package:mysql1/mysql1.dart';

import '../models/user_model.dart';
import 'package:bcrypt/bcrypt.dart';

class UserService {
  final MySqlConnection connection;

  UserService(this.connection);

  // Register a new user
  Future<User> registerUser(User user) async {
    // Hash the password
    final hashedPassword = BCrypt.hashpw(user.password, BCrypt.gensalt());

    final result = await connection.query(
      '''INSERT INTO users (fullname, email_address, contact_number, password, otp, email_verified) 
    VALUES (?, ?, ?, ?, ?, ?)''',
      [
        user.fullname,
        user.emailAddress,
        user.contactNumber,
        hashedPassword, // Store the hashed password
        user.otp,
        user.emailVerified ? '1' : '0'
      ],
    );

    return User(
      userId: result.insertId ?? 0,
      fullname: user.fullname,
      emailAddress: user.emailAddress,
      contactNumber: user.contactNumber,
      password: '', // Don't return the password
      otp: user.otp,
      emailVerified: user.emailVerified,
    );
  }

  // Login user
  Future<User?> loginUser(String emailAddress, String password) async {
    final result = await connection.query(
      'SELECT * FROM users WHERE email_address = ?',
      [emailAddress],
    );

    if (result.isEmpty) {
      return null; // User not found
    }

    final userRow = result.first;
    final hashedPassword = userRow['password'];

    // Compare the plain-text password with the hashed password
    if (!BCrypt.checkpw(password, hashedPassword)) {
      return null; // Password does not match
    }

    return User(
      userId: userRow['user_id'],
      fullname: userRow['fullname'],
      emailAddress: userRow['email_address'],
      contactNumber: userRow['contact_number'],
      password: '', // Don't return the password
      otp: userRow['otp'],
      emailVerified: userRow['email_verified'] == 1,
    );
  }

  // Update user profile
  Future<void> updateProfile(User user) async {
    // First get the existing user data
    final result = await connection
        .query('SELECT * FROM users WHERE user_id = ?', [user.userId]);

    if (result.isEmpty) {
      throw Exception('User not found');
    }

    // Get current user data
    final currentUser = result.first;

    // Create query parts dynamically based on provided fields
    final List<String> updateFields = [];
    final List<dynamic> values = [];

    // Check each field - only add to query if it's provided in request
    if (user.fullname != '') {
      updateFields.add('fullname = ?');
      values.add(user.fullname);
    }

    if (user.emailAddress != '') {
      updateFields.add('email_address = ?');
      values.add(user.emailAddress);
    }

    if (user.contactNumber != '') {
      updateFields.add('contact_number = ?');
      values.add(user.contactNumber);
    }

    if (user.address != null && user.address != '') {
      updateFields.add('address = ?');
      values.add(user.address);
    }

    // If no fields to update, return early
    if (updateFields.isEmpty) {
      return;
    }

    // Add user_id to values array
    values.add(user.userId);

    // Construct and execute the query
    final query = '''
    UPDATE users 
    SET ${updateFields.join(', ')} 
    WHERE user_id = ?
  ''';

    await connection.query(query, values);
  }

  // Update profile image
  Future<void> updateProfileImage(
      int userId, String profileImageFilename) async {
    await connection.query(
      '''UPDATE users SET profile_image = ? WHERE user_id = ?''',
      [profileImageFilename, userId],
    );
  }

  // Change password
  Future<bool> changePassword(
      int userId, String oldPassword, String newPassword) async {
    // Fetch the user's current password
    final result = await connection.query(
      'SELECT password FROM users WHERE user_id = ?',
      [userId],
    );

    if (result.isEmpty) {
      throw Exception('User not found');
    }

    final currentPassword = result.first['password'];

    // Compare the old password with the stored password
    if (!BCrypt.checkpw(oldPassword, currentPassword)) {
      return false; // Old password does not match
    }

    // Hash the new password
    final hashedNewPassword = BCrypt.hashpw(newPassword, BCrypt.gensalt());

    // Update to the new password
    await connection.query(
      'UPDATE users SET password = ? WHERE user_id = ?',
      [hashedNewPassword, userId],
    );

    return true; // Password updated successfully
  }

  // Handle forgot password
  Future<void> updatePasswordWithOtp(
      String emailAddress, String newPassword) async {
    await connection.query(
      'UPDATE users SET password = ? WHERE email_address = ?',
      [newPassword, emailAddress],
    );
  }

  // Verify OTP
  Future<bool> verifyOtp(String emailAddress, String otp) async {
    final result = await connection.query(
      'SELECT * FROM users WHERE email_address = ? AND otp = ?',
      [emailAddress, otp],
    );

    if (result.isEmpty) return false;

    // Update email_verified status to true
    await connection.query(
      "UPDATE users SET email_verified = '1' WHERE email_address = ?",
      [emailAddress],
    );

    return true;
  }
}
