import 'package:mysql1/mysql1.dart';
import '../database/db.dart';
import 'package:nepstyle_cms/services/product_service.dart';

class HomeService {
  final ManagedConnection connection;
  final ProductService productService;

  HomeService(this.connection, this.productService);

  // Helper to safely convert rows, especially DateTime fields
  Map<String, dynamic> convertRow(ResultRow row) {
    final map = Map<String, dynamic>.from(row.fields);
    map.forEach((key, value) {
      if (value is DateTime) {
        map[key] = value.toIso8601String();
      }
    });
    return map;
  }

  // Fetch categories
  Future<List<Map<String, dynamic>>> fetchCategories() async {
    final categories = await connection.query('SELECT * FROM categories');
    return categories.map(convertRow).toList();
  }

  // Fetch brands
  Future<List<Map<String, dynamic>>> fetchBrands() async {
    final brands = await connection.query('SELECT * FROM brands');
    return brands.map(convertRow).toList();
  }

  // Fetch all products
  Future<List<Map<String, dynamic>>> fetchProducts() async {
    final products = await connection.query('SELECT * FROM products');
    return products.map(convertRow).toList();
  }

  // Fetch flash sale products
  Future<List<Map<String, dynamic>>> fetchflashsaleProducts() async {
    final products =
        await connection.query('SELECT * FROM flash_sale_products');
    return products.map(convertRow).toList();
  }

  // Fetch recommended products for a user
  Future<List<Map<String, dynamic>>> fetchRecommendedProducts(
      String userId) async {
    try {
      final int id = int.parse(userId);
      print("Fetching recommendations for User ID: $id");

      // Step 1: Get Recently Viewed Product IDs
      final viewedResults = await connection.query(
          'SELECT product_id FROM user_activity WHERE user_id = ? AND action_type = "view" ORDER BY timestamp DESC LIMIT 5',
          [id]);

      List<int> productIds =
          viewedResults.map((row) => row['product_id'] as int).toList();
      print("Recently Viewed Products: $productIds");

      List<Map<String, dynamic>> recommendedProducts = [];

      if (productIds.isEmpty) {
        // No viewing history? Return trending products instead
        print("User has no history, returning trending products.");
        recommendedProducts = await productService.getTrendingProducts();
      } else {
        // Step 2: Get Categories of Viewed Products
        String placeholders = List.filled(productIds.length, '?').join(',');
        final categoryResults = await connection.query(
            'SELECT DISTINCT category_id FROM products WHERE product_id IN ($placeholders)',
            productIds);

        List<int> categoryIds =
            categoryResults.map((row) => row['category_id'] as int).toList();
        print("Related Categories: $categoryIds");

        if (categoryIds.isNotEmpty) {
          // Step 3: Get Products from Those Categories
          String categoryPlaceholders =
              List.filled(categoryIds.length, '?').join(',');
          final recommendedResults = await connection.query(
              'SELECT * FROM products WHERE category_id IN ($categoryPlaceholders) LIMIT 10',
              categoryIds);

          recommendedProducts = recommendedResults.map(convertRow).toList();
        }
      }

      print("Recommended Products: ${recommendedProducts.length}");
      return recommendedProducts;
    } catch (e) {
      print("Error fetching recommendations: $e");
      return [];
    }
  }

  // Log user activity (view/click etc.)
  Future<void> logUserActivity(
      int userId, int productId, String actionType) async {
    await connection.query(
        'INSERT INTO user_activity (user_id, product_id, action_type) VALUES (?, ?, ?)',
        [userId, productId, actionType]);
  }
}
