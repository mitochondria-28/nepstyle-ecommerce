import 'dart:convert';
import 'package:mysql1/mysql1.dart';
import 'package:shelf/shelf.dart';
import 'package:shelf_router/shelf_router.dart';

import '../models/products_model.dart';
import '../services/product_service.dart';

class ProductRoutes {
  final ProductService productService;

  ProductRoutes(this.productService, this.connection);
  final MySqlConnection connection;
  Router get router {
    final router = Router();

    // Add a new product
    router.post('/add', (Request request) async {
      try {
        final payload = await request.readAsString();
        final data = jsonDecode(payload);

        final product = Product(
          categoryId: data['category_id'],
          brandId: data['brand_id'],
          productName: data['product_name'],
          categoryName: data['category_name'],
          brandName: data['brand_name'],
          productDescription: data['product_description'],
          productThumbnail: data['product_thumbnail'],
          normalPrice: data['normal_price'],
          sellPrice: data['sell_price'],
          totalProductCount: data['total_product_count'],
        );
        print('Attempting to add product: $data'); // Log incoming data
        final addedProduct = await productService.addProduct(product);

        return Response.ok(jsonEncode({
          'status': true,
          'message': 'Product added successfully',
          'product': addedProduct.toMap(),
        }));
      } catch (e) {
        print('Error adding product: $e');
        return Response(500,
            body: jsonEncode({
              'status': false,
              'message': 'Failed to add product: ${e.toString()}',
            }));
      }
    });

    // Retrieve all products
    router.get('/all', (Request request) async {
      try {
        final products = await productService.getAllProducts();

        return Response.ok(jsonEncode({
          'status': true,
          'products': products.map((product) => product.toMap()).toList(),
        }));
      } catch (e) {
        return Response(500,
            body: jsonEncode({
              'status': false,
              'message': 'Failed to fetch products: ${e.toString()}',
            }));
      }
    });

    // Retrieve products by category ID
    router.get('/category/<id|[0-9]+>', (Request request, String id) async {
      try {
        final categoryId = int.parse(id);
        final products =
            await productService.getProductsByCategoryId(categoryId);

        return Response.ok(jsonEncode({
          'status': true,
          'products': products.map((product) => product.toMap()).toList(),
        }));
      } catch (e) {
        return Response(500,
            body: jsonEncode({
              'status': false,
              'message': 'Failed to fetch products: ${e.toString()}',
            }));
      }
    });

    // Retrieve products by brand ID
    router.get('/brand/<id|[0-9]+>', (Request request, String id) async {
      try {
        final brandId = int.parse(id);
        final products = await productService.getProductsByBrandId(brandId);

        return Response.ok(jsonEncode({
          'status': true,
          'products': products.map((product) => product.toMap()).toList(),
        }));
      } catch (e) {
        return Response(500,
            body: jsonEncode({
              'status': false,
              'message': 'Failed to fetch products: ${e.toString()}',
            }));
      }
    });
//route to delete product
    router.delete('/delete/<id|[0-9]+>', (Request request, String id) async {
      try {
        final productId = int.parse(id);
        final deleted = await productService.deleteProduct(productId);
        return Response.ok(jsonEncode({
          'status': true,
          'message': 'Product deleted successfully',
          'deleted': deleted,
        }));
      } catch (e) {
        return Response(500,
            body: jsonEncode({
              'status': false,
              'message': 'Failed to delete product: ${e.toString()}',
            }));
      }
    });

    router.get('/recommendations/<userId>',
        (Request request, String userId) async {
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

            recommendedProducts = recommendedResults.map((row) {
              final fields = row.fields;
              return fields.map((key, value) {
                if (value is DateTime) {
                  return MapEntry(key,
                      value.toIso8601String()); // Convert DateTime to String
                }
                return MapEntry(key, value);
              });
            }).toList();
          }
        }

        print("Recommended Products: ${recommendedProducts.length}");
        return Response.ok(
            jsonEncode({
              'status': true,
              'recommended_products': recommendedProducts,
            }),
            headers: {'Content-Type': 'application/json'});
      } catch (e) {
        print("Error fetching recommendations: $e");
        return Response(500,
            body: jsonEncode({
              'status': false,
              'message': 'Failed to fetch recommendations: ${e.toString()}',
            }),
            headers: {'Content-Type': 'application/json'});
      }
    });
    // Route for searching products
    router.get('/search/products/<query>',
        (Request request, String query) async {
      try {
        // Perform full-text search on product name and description
        final results = await connection.query(
            'SELECT * FROM products WHERE MATCH(product_name, product_description) AGAINST(? IN NATURAL LANGUAGE MODE) LIMIT 10',
            [query]);
        // Convert result to a list of Product objects
        final products =
            results.map((row) => Product.fromMap(row.fields)).toList();

        return Response.ok(jsonEncode({
          'status': true,
          'products': products
              .map((p) => p.toMap())
              .toList(), // ✅ Convert to Map instead of JSON string
        }));
      } catch (e) {
        return Response(500,
            body: jsonEncode({
              'status': false,
              'message': 'Failed to fetch products: ${e.toString()}',
            }));
      }
    });

    return router;
  }
}
