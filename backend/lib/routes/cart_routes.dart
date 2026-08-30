import 'dart:convert';
import 'package:shelf/shelf.dart';
import 'package:shelf_router/shelf_router.dart';

import '../models/cart_model.dart';
import '../services/cart_service.dart';

class CartRoutes {
  final CartService cartService;

  CartRoutes(this.cartService);

  Router get router {
    final router = Router();

    // Add a product to the cart
    router.post('/add', (Request request) async {
      try {
        final payload = await request.readAsString();
        final data = jsonDecode(payload);

        final cartItem = CartItem(
          userId: data['user_id'],
          productId: data['product_id'],
          productName: data['product_name'],
          productThumbnail: data['product_thumbnail'],
          productDescription: data['product_description'],
          normalPrice: data['normal_price'],
          sellPrice: data['sell_price'],
          discountPercentage: data['discount_percentage'],
          discountedPrice: data['discounted_price'],
          quantity: data['quantity'],
        );

        final addedCartItem = await cartService.addToCart(cartItem);

        return Response.ok(jsonEncode({
          'status': true,
          'message': 'Product added to cart',
          'cart_item': addedCartItem.toMap(),
        }));
      } catch (e) {
        return Response(500,
            body: jsonEncode({
              'status': false,
              'message': 'Failed to add product to cart: ${e.toString()}',
            }));
      }
    });

    // Get all cart items for a user
    router.get('/<user_id|[0-9]+>', (Request request, String userId) async {
      try {
        final cartItems = await cartService.getCartItems(int.parse(userId));

        return Response.ok(jsonEncode({
          'status': true,
          'cart_items': cartItems.map((item) => item.toMap()).toList(),
        }));
      } catch (e) {
        return Response(500,
            body: jsonEncode({
              'status': false,
              'message': 'Failed to fetch cart items: ${e.toString()}',
            }));
      }
    });

    return router;
  }
}
