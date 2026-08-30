import 'dart:convert';
import 'dart:io';
import 'package:mime/mime.dart';
import 'package:shelf/shelf.dart';
import 'package:shelf_multipart/shelf_multipart.dart';
import 'package:shelf_router/shelf_router.dart';

import '../models/user_model.dart';
import '../services/user_service.dart';

class UserRoutes {
  final UserService userService;

  UserRoutes(this.userService);

  Router get router {
    final router = Router();

    // Register user
    router.post('/register', (Request request) async {
      try {
        final payload = await request.readAsString();
        final data = jsonDecode(payload);

        final user = User(
          fullname: data['fullname'],
          emailAddress: data['email_address'],
          contactNumber: data['contact_number'],
          password: data['password'],
          otp: data['otp'],
         
        );

        final registeredUser = await userService.registerUser(user);

        return Response.ok(jsonEncode({
          'status': true,
          'message': 'User registered successfully',
          'user': registeredUser.toMap(),
        }));
      } catch (e) {
        return Response(500, body: jsonEncode({'status': false, 'message': e.toString()}));
      }
    });

    // Login user
    router.post('/login', (Request request) async {
      try {
        final payload = await request.readAsString();
        final data = jsonDecode(payload);

        final user = await userService.loginUser(data['email_address'], data['password']);

        if (user == null) {
          return Response(401, body: jsonEncode({'status': false, 'message': 'Invalid credentials'}));
        }

        return Response.ok(jsonEncode({'status': true, 'user': user.toMap()}));
      } catch (e) {
        return Response(500, body: jsonEncode({'status': false, 'message': e.toString()}));
      }
    });

    // Update profile
   router.put('/update-profile', (Request request) async {
  try {
    final payload = await request.readAsString();
    final data = jsonDecode(payload);

    // First, validate that user_id exists
    if (data['user_id'] == null) {
      return Response(400, 
        body: jsonEncode({
          'status': false, 
          'message': 'user_id is required'
        })
      );
    }

    // Create user object with null checks for optional fields
    final user = User(
      userId: data['user_id'],
      fullname: data['fullname'] ?? '', // Provide default empty string if null
      emailAddress: data['email_address'] ?? '', // Provide default empty string if null
      contactNumber: data['contact_number'] ?? '', // Provide default empty string if null
      address: data['address'] ?? '', // Provide default empty string if null
      password: '', // Since it's not being updated
    );

    await userService.updateProfile(user);

    return Response.ok(
      jsonEncode({
        'status': true, 
        'message': 'Profile updated successfully'
      })
    );
  } catch (e) {
    return Response(500, 
      body: jsonEncode({
        'status': false, 
        'message': e.toString()
      })
    );
  }
});

    // Update profile image
// Update profile image
 // for parsing multipart requests

// Profile Image Update Route
router.post('/update-profile-image', (Request request) async {
  try {
    final contentType = request.headers['content-type'];
    if (contentType == null || !contentType.startsWith('multipart/form-data')) {
      return Response(400, body: jsonEncode({'status': false, 'message': 'Invalid request. Content-Type must be multipart/form-data.'}));
    }

    final transformer = MimeMultipartTransformer(contentType.split('boundary=')[1]);
    final parts = await request.read().transform(transformer).toList();

    if (parts.isEmpty) {
      return Response(400, body: jsonEncode({'status': false, 'message': 'No parts found in the request'}));
    }

    int? userId;
    String? profileImageFilename;

    final uploadDir = Directory('uploads/profileImages');
    if (!await uploadDir.exists()) {
      await uploadDir.create(recursive: true);
    }

    for (final part in parts) {
      // For user_id field
      if (part.headers['content-disposition']?.contains('name="user_id"') == true) {
        // Convert the stream to string
        final bytes = await part.fold<List<int>>(
          [],
          (bytes, data) => bytes..addAll(data),
        );
        final field = utf8.decode(bytes);
        userId = int.tryParse(field);
        if (userId == null) {
          return Response(400, body: jsonEncode({'status': false, 'message': 'Invalid user ID'}));
        }
      }

      // For profile image file
      if (part.headers['content-disposition']?.contains('name="profile_image"') == true) {
        final filename = part.headers['content-disposition']
            ?.split('filename=')
            .last
            .replaceAll('"', '') ?? 
            'default.jpg';
            
        profileImageFilename = '${DateTime.now().millisecondsSinceEpoch}.${filename.split('.').last}';

        final file = File('${uploadDir.path}/$profileImageFilename');
        await file.create(recursive: true);
        await part.pipe(file.openWrite());
      }
    }

    if (userId == null) {
      return Response(400, body: jsonEncode({'status': false, 'message': 'Missing user ID in the request'}));
    }

    if (profileImageFilename != null) {
      await userService.updateProfileImage(userId, profileImageFilename);

      return Response.ok(jsonEncode({
        'status': true,
        'message': 'Profile image updated successfully',
        'profile_image_url': 'http://yourdomain.com/profileImages/$profileImageFilename',
      }));
    }

    return Response(400, body: jsonEncode({'status': false, 'message': 'Image upload failed. No file uploaded.'}));
  } catch (e) {
    return Response(500, body: jsonEncode({'status': false, 'message': e.toString()}));
  }
});



    // Change password
    router.put('/change-password', (Request request) async {
  try {
    final payload = await request.readAsString();
    final data = jsonDecode(payload);

    final int userId = data['user_id'];
    final String oldPassword = data['old_password'];
    final String newPassword = data['new_password'];

    // Validate input
    if (oldPassword.isEmpty || newPassword.isEmpty) {
      return Response(
        400,
        body: jsonEncode({'status': false, 'message': 'Old and new passwords are required'}),
      );
    }

    // Attempt to change the password
    final isPasswordChanged = await userService.changePassword(userId, oldPassword, newPassword);

    if (!isPasswordChanged) {
      return Response(
        400,
        body: jsonEncode({'status': false, 'message': 'Old password is incorrect'}),
      );
    }

    return Response.ok(jsonEncode({'status': true, 'message': 'Password changed successfully'}));
  } catch (e) {
    return Response(
      500,
      body: jsonEncode({'status': false, 'message': e.toString()}),
    );
  }
});


    // Forgot password
    router.post('/forgot-password', (Request request) async {
      try {
        final payload = await request.readAsString();
        final data = jsonDecode(payload);

        await userService.updatePasswordWithOtp(data['email_address'], data['new_password']);

        return Response.ok(jsonEncode({'status': true, 'message': 'Password updated successfully'}));
      } catch (e) {
        return Response(500, body: jsonEncode({'status': false, 'message': e.toString()}));
      }
    });

    return router;
  }
}
