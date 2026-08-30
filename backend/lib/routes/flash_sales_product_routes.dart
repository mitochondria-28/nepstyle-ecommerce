import 'dart:convert';
import 'package:shelf/shelf.dart';
import 'package:shelf_router/shelf_router.dart';

import '../models/flash_sale_products_model.dart';
import '../services/flash_sale_service.dart';

class FlashSaleProductRoutes {
  final FlashSaleProductService flashSaleProductService;

  FlashSaleProductRoutes(this.flashSaleProductService);

  Router get router {
    final router = Router();

    // Add a new flash sale product
    router.post('/add', (Request request) async {
      try {
        final payload = await request.readAsString();
        final data = jsonDecode(payload);

        final flashSaleProduct = FlashSaleProduct(
          productId: data['product_id'],
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
          discountPercentage: data['discount_percentage'],
          discountedPrice: data['discounted_price'],
        );

        final addedFlashSaleProduct =
            await flashSaleProductService.addFlashSaleProduct(flashSaleProduct);

        return Response.ok(jsonEncode({
          'status': true,
          'message': 'Flash sale product added successfully',
          'flash_sale_product': addedFlashSaleProduct.toMap(),
        }));
      } catch (e) {
        return Response(500,
            body: jsonEncode({
              'status': false,
              'message': 'Failed to add flash sale product: ${e.toString()}',
            }));
      }
    });

    // Retrieve all flash sale products
    router.get('/all', (Request request) async {
      try {
        final flashSaleProducts =
            await flashSaleProductService.getAllFlashSaleProducts();

        return Response.ok(jsonEncode({
          'status': true,
          'flash_sale_products':
              flashSaleProducts.map((fsp) => fsp.toMap()).toList(),
        }));
      } catch (e) {
        return Response(500,
            body: jsonEncode({
              'status': false,
              'message': 'Failed to fetch flash sale products: ${e.toString()}',
            }));
      }
    });
    router.delete('/delete/<flashSaleId>',
        (Request request, String flashSaleId) async {
      try {
        final int id = int.parse(flashSaleId);
        final bool isDeleted =
            await flashSaleProductService.deleteFlashSale(id);

        if (isDeleted) {
          return Response.ok(jsonEncode({
            'status': true,
            'message': 'Flash Sale Product  deleted successfully',
          }));
        } else {
          return Response(404,
              body: jsonEncode({
                'status': false,
                'message': 'Flash Sale Product  not found',
              }));
        }
      } catch (e) {
        return Response(500,
            body: jsonEncode({
              'status': false,
              'message':
                  'Failed to delete Flash Sale Product : ${e.toString()}',
            }));
      }
    });

    return router;
  }
}
