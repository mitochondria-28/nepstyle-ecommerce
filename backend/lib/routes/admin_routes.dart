import 'dart:convert';
import 'package:shelf/shelf.dart';
import 'package:shelf_router/shelf_router.dart';
import '../services/admin_service.dart';

class AdminRoutes {
  final AdminService adminService;

  AdminRoutes(this.adminService);

  Router get router {
    final router = Router();

    router.post('/login', (Request request) async {
      try {
        final payload = await request.readAsString();
        final data = jsonDecode(payload);

        final admin = await adminService.login(
          data['email_address'] ?? '',
          data['password'] ?? '',
        );

        if (admin == null) {
          return Response(
            401,
            body: jsonEncode({
              'status': false,
              'message': 'Invalid email or password',
            }),
          );
        }

        return Response.ok(jsonEncode({
          'status': true,
          'message': 'Login successful',
          'admin': admin.toMap(),
        }));
      } catch (e) {
        return Response(
          500,
          body: jsonEncode({'status': false, 'message': e.toString()}),
        );
      }
    });

    return router;
  }
}
