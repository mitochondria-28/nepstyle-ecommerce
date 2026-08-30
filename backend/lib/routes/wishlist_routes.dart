import 'dart:convert';
import 'package:shelf/shelf.dart';
import 'package:shelf_router/shelf_router.dart';

import '../models/wishlist_model.dart';
import '../services/wishlist_service.dart';

class WishlistRoutes {
  final WishlistService wishlistService;

  WishlistRoutes(this.wishlistService);

  Router get router {
    final router = Router();

    // Add a product to the wishlist
    router.post('/add', (Request request) async {
      try {
        final payload = await request.readAsString();
        final data = jsonDecode(payload);

        final wishlistItem = WishlistItem(
          userId: data['user_id'],
          productId: data['product_id'],
          productName: data['product_name'],
          productThumbnail: data['product_thumbnail'],
          productDescription: data['product_description'],
          normalPrice: data['normal_price'],
          sellPrice: data['sell_price'],
          discountPercentage: data['discount_percentage'],
          discountedPrice: data['discounted_price'],
        );

        final addedWishlistItem = await wishlistService.addToWishlist(wishlistItem);

        return Response.ok(jsonEncode({
          'status': true,
          'message': 'Product added to wishlist',
          'wishlist_item': addedWishlistItem.toMap(),
        }));
      } catch (e) {
        return Response(500,
            body: jsonEncode({
              'status': false,
              'message': 'Failed to add product to wishlist: ${e.toString()}',
            }));
      }
    });

    // Get all wishlist items for a user
    router.get('/<user_id|[0-9]+>', (Request request, String userId) async {
      try {
        final wishlistItems = await wishlistService.getWishlistItems(int.parse(userId));

        return Response.ok(jsonEncode({
          'status': true,
          'wishlist_items': wishlistItems.map((item) => item.toMap()).toList(),
        }));
      } catch (e) {
        return Response(500,
            body: jsonEncode({
              'status': false,
              'message': 'Failed to fetch wishlist items: ${e.toString()}',
            }));
      }
    });

    // Remove an item from the wishlist
    router.delete('/<wishlist_id|[0-9]+>', (Request request, String wishlistId) async {
      try {
        await wishlistService.removeFromWishlist(int.parse(wishlistId));

        return Response.ok(jsonEncode({
          'status': true,
          'message': 'Wishlist item removed successfully',
        }));
      } catch (e) {
        return Response(500,
            body: jsonEncode({
              'status': false,
              'message': 'Failed to remove wishlist item: ${e.toString()}',
            }));
      }
    });

    return router;
  }
}
