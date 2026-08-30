import 'package:nepstyle_cms/database/db.dart';
import 'package:nepstyle_cms/routes/brands_routes.dart';
import 'package:nepstyle_cms/routes/cart_routes.dart';
import 'package:nepstyle_cms/routes/flash_sales_product_routes.dart';
import 'package:nepstyle_cms/routes/home_routes.dart';
import 'package:nepstyle_cms/routes/order_routes.dart';
import 'package:nepstyle_cms/routes/product_category_routes.dart';
import 'package:nepstyle_cms/routes/product_routes.dart';
import 'package:nepstyle_cms/routes/review_routes.dart';
import 'package:nepstyle_cms/routes/user_routes.dart';
import 'package:nepstyle_cms/routes/category_routes.dart'; // Import category routes
import 'package:nepstyle_cms/routes/wishlist_routes.dart';
import 'package:nepstyle_cms/services/brands_service.dart';
import 'package:nepstyle_cms/services/cart_service.dart';
import 'package:nepstyle_cms/services/flash_sale_service.dart';
import 'package:nepstyle_cms/services/home_service.dart';
import 'package:nepstyle_cms/services/order_service.dart';
import 'package:nepstyle_cms/services/product_category_service.dart';
import 'package:nepstyle_cms/services/product_service.dart';
import 'package:nepstyle_cms/services/review_service.dart';
import 'package:nepstyle_cms/services/user_service.dart';
import 'package:nepstyle_cms/services/category_service.dart'; // Import category service
import 'package:nepstyle_cms/services/wishlist_service.dart';
import 'package:shelf/shelf.dart';
import 'package:shelf/shelf_io.dart' as io;
import 'package:shelf_router/shelf_router.dart';
import 'dart:io';

// Enhanced CORS Middleware
Middleware corsHeaders() {
  return (Handler handler) {
    return (Request request) async {
      if (request.method == 'OPTIONS') {
        // Handle preflight OPTIONS requests
        return Response.ok(
          '',
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers':
                'Origin, Content-Type, Authorization',
          },
        );
      }

      final response = await handler(request);
      return response.change(headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Origin, Content-Type, Authorization',
      });
    };
  };
}

Future<void> main() async {
  try {
    // Initialize database connection
    final connection = await Database.getConnection();
    print('Database connection established.');

    // Initialize services
    final userService = UserService(connection);
    final categoryService = CategoryService(connection);
    final categorizedProductService = CategorizedProductService(connection);
    final brandService = BrandService(connection);
    final productService = ProductService(connection);
    final flashSaleProductService = FlashSaleProductService(connection);
    final cartService = CartService(connection);
    final wishlistService = WishlistService(connection);
    final homeService = HomeService(connection, productService);
    final orderService = OrderService(connection);
    final reviewService = ReviewService(connection);
    // Initialize routes
    final authRoutes = UserRoutes(userService);
    final categoryRoutes = CategoryRoutes(categoryService, connection);
    final categorizedProductRoutes =
        CategorizedProductRoutes(categorizedProductService);
    final brandRoutes = BrandRoutes(brandService, connection);
    final productRoutes = ProductRoutes(productService, connection);
    final flashSaleProductRoutes =
        FlashSaleProductRoutes(flashSaleProductService);
    final cartRoutes = CartRoutes(cartService);
    final wishlistRoutes = WishlistRoutes(wishlistService);
    final homeRoutes = HomeRoutes(homeService);
    final orderRoutes = OrderRoutes(orderService);
    final reviewRoutes = ReviewRoutes(reviewService);
    // Create router and mount routes
    final app = Router();
    app.mount('/api/auth/', authRoutes.router);
    app.mount('/api/', homeRoutes.router);
    app.mount('/api/categories/', categoryRoutes.router);
    app.mount('/api/categorizedproducts/', categorizedProductRoutes.router);
    app.mount('/api/brands/', brandRoutes.router);
    app.mount('/api/products/', productRoutes.router);
    app.mount('/api/flash-sale-products/', flashSaleProductRoutes.router);
    app.mount('/api/carts/', cartRoutes.router);
    app.mount('/api/wishlists/', wishlistRoutes.router);
    app.mount('/api/orders/', orderRoutes.router);
    app.mount('/api/reviews/',
        reviewRoutes.router); // Mount review routes (new line, handler)

    // Create a pipeline with middlewares
    final handler = Pipeline()
        .addMiddleware(logRequests())
        .addMiddleware(corsHeaders()) // Add enhanced CORS middleware
        .addHandler(app);

    // Start the server
    final server = await io.serve(handler, '0.0.0.0', 8080);
    print('Server running on http://${server.address.host}:${server.port}');

    // Handle application shutdown signals
    ProcessSignal.sigint.watch().listen((_) async {
      print('Shutting down server...');
      await Database.closeConnection(); // Close database connection
      await server.close(); // Stop the server
      print('Server stopped.');
      exit(0);
    });
  } catch (e) {
    print('Failed to start the server: $e');
    exit(1);
  }
}
