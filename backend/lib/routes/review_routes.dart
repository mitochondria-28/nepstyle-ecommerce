import 'dart:convert';
import 'package:shelf/shelf.dart';
import 'package:shelf_router/shelf_router.dart';
import '../services/review_service.dart';

class ReviewRoutes {
  final ReviewService reviewService;

  ReviewRoutes(this.reviewService);

  Router get router {
    final router = Router();

    // Add Review
    router.post('/add', (Request req) async {
      try {
        final payload = await req.readAsString();
        final data = jsonDecode(payload);

        final success = await reviewService.addReview(
          productId: data['product_id'],
          userId: data['user_id'],
          userName: data['user_name'],
          comment: data['comment'],
          rating: (data['rating'] ?? 0).toDouble(),
        );

        if (success) {
          return Response.ok(jsonEncode({
            'status': true,
            'message': 'Review added successfully',
          }));
        } else {
          return Response(400,
              body: jsonEncode({
                'status': false,
                'message': 'Failed to add review',
              }));
        }
      } catch (e) {
        return Response.internalServerError(
          body: jsonEncode({'error': e.toString()}),
        );
      }
    });

    // GET /reviews/list?product_id=1
    router.get('/list', (Request req) async {
      try {
        final params = req.url.queryParameters;
        final productIdParam = params['product_id'];
        int? productId;

        if (productIdParam != null) {
          productId = int.tryParse(productIdParam);
          if (productId == null) {
            return Response(400,
                body: jsonEncode({
                  'status': false,
                  'message': 'Invalid product_id format',
                }));
          }
        }

        print('📦 Fetching reviews for productId: $productId');

        final reviews = await reviewService.getReviews(productId: productId);

        // Transform data to ensure all DateTime objects are converted to strings
        final safeReviews = reviews.map((review) {
          final safeReview = Map<String, dynamic>.from(review);

          // Ensure all DateTime fields are converted to strings
          for (final key in review.keys) {
            if (review[key] is DateTime) {
              safeReview[key] = (review[key] as DateTime).toIso8601String();
            }
          }

          return safeReview;
        }).toList();

        return Response.ok(
          jsonEncode({
            'status': true,
            'data': safeReviews,
          }),
          headers: {'Content-Type': 'application/json'},
        );
      } catch (e, stack) {
        print('❌ Error in GET /reviews/list: $e');
        print('📚 Stacktrace: $stack');

        return Response.internalServerError(
          body: jsonEncode({'status': false, 'error': e.toString()}),
        );
      }
    });

    return router;
  }
}
