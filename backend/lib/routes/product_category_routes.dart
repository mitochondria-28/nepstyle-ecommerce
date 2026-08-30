import 'dart:convert';
import 'package:shelf/shelf.dart';
import 'package:shelf_router/shelf_router.dart';

import '../models/product_category_model.dart';
import '../services/product_category_service.dart';


class CategorizedProductRoutes {
  final CategorizedProductService productService;

  CategorizedProductRoutes(this.productService);

  Router get router {
    final router = Router();

    // Add a new product to a category
    router.post('/add', (Request request) async {
      try {
        final payload = await request.readAsString();
        final data = jsonDecode(payload);

        final product = ProductCategoryModel(
          productName: data['product_name'],
          productDescription: data['product_description'],
          productThumbnail: data['product_thumbnail'],
          normalPrice: data['normal_price'],
          sellPrice: data['sell_price'],
          totalProductCount: data['total_product_count'],
          categoryId: data['category_id'], // Ensure that category ID is provided
          categoryName: data['category_name'],
        );

        final addedProduct = await productService.addProduct(product);

        return Response.ok(jsonEncode({
          'status': true,
          'message': 'Product added successfully',
          'product': addedProduct.toMap(),
        }));
      } catch (e) {
        return Response(500, body: jsonEncode({
          'status': false,
          'message': 'Failed to add product: ${e.toString()}',
        }));
      }
    });

    // Retrieve products by category ID
    router.get('/category/<id|[0-9]+>', (Request request, String id) async {
      try {
        final categoryId = int.parse(id);
        final products = await productService.getProductsByCategoryId(categoryId);

        return Response.ok(jsonEncode({
          'status': true,
          'products': products.map((prod) => prod.toMap()).toList(),
        }));
      } catch (e) {
        return Response(500, body: jsonEncode({
          'status': false,
          'message': 'Failed to fetch products: ${e.toString()}',
        }));
      }
    });
 // Retrieve a single product by ID
    router.get('/<productId|[0-9]+>', (Request request, String productId) async {
      try {
        final productIdInt = int.parse(productId);
        final product = await productService.getProductById(productIdInt);

        if (product == null) {
          return Response(404, body: jsonEncode({
            'status': false,
            'message': 'Product not found',
          }));
        }

        return Response.ok(jsonEncode({
          'status': true,
          'product': product.toMap(),
        }));
      } catch (e) {
        return Response(500, body: jsonEncode({
          'status': false,
          'message': 'Failed to fetch product: ${e.toString()}',
        }));
      }
    });

    return router;
  }
}
