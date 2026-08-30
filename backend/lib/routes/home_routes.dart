import 'dart:convert';

import 'package:shelf/shelf.dart';
import 'package:shelf_router/shelf_router.dart';
import '../services/home_service.dart';

class HomeRoutes {
  final HomeService homeService;

  HomeRoutes(this.homeService);

  Router get router {
    final router = Router();

    router.get('/home/<userId>', (Request request, String userId) async {
      try {
        // Fetch data using the HomeService
        final categories = await homeService.fetchCategories();
        final brands = await homeService.fetchBrands();
        final products = await homeService.fetchProducts();
        final flashSaleProducts = await homeService.fetchflashsaleProducts();
        if (userId == 0) {
          return Response.ok(
            jsonEncode({
              'status': true,
              'categories': categories,
              'brands': brands,
              'products': products,
              'flashSaleProducts': flashSaleProducts,
            }),
            headers: {'Content-Type': 'application/json'},
          );
        } else {
          final recommendedProducts =
              await homeService.fetchRecommendedProducts(userId);
          return Response.ok(
            jsonEncode({
              'status': true,
              'categories': categories,
              'brands': brands,
              'products': products,
              'flashSaleProducts': flashSaleProducts,
              'recommendedProducts': recommendedProducts,
            }),
            headers: {'Content-Type': 'application/json'},
          );
        }

        // Combine data into a single response
      } catch (e) {
        return Response.internalServerError(
          body: jsonEncode({
            'status': false,
            'message': 'Failed to fetch data: ${e.toString()}',
          }),
          headers: {'Content-Type': 'application/json'},
        );
      }
    });
    router.post('/log-activity', (Request request) async {
      try {
        final payload = await request.readAsString();
        final data = jsonDecode(payload);

        final int userId = data['user_id'];
        final int productId = data['product_id'];
        final String actionType = data['action_type'];

        // ✅ Log the activity
        await homeService.logUserActivity(userId, productId, actionType);

        return Response.ok(jsonEncode(
            {'status': true, 'message': 'User activity logged successfully'}));
      } catch (e) {
        return Response(500,
            body: jsonEncode({
              'status': false,
              'message': 'Failed to log user activity: ${e.toString()}'
            }));
      }
    });

    return router;
  }
}
