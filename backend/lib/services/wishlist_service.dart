import 'package:mysql1/mysql1.dart';
import '../models/wishlist_model.dart';

class WishlistService {
  final MySqlConnection connection;

  WishlistService(this.connection);

  // Add a product to the wishlist
  Future<WishlistItem> addToWishlist(WishlistItem wishlistItem) async {
    // Check if the product is already in the wishlist for the user
    final existingWishlist = await connection.query(
      'SELECT * FROM wishlist WHERE user_id = ? AND product_id = ?',
      [wishlistItem.userId, wishlistItem.productId],
    );

    if (existingWishlist.isNotEmpty) {
      throw Exception('Product is already in the wishlist');
    }

    // Insert new product into wishlist
    final result = await connection.query(
      '''INSERT INTO wishlist (user_id, product_id, product_name, product_thumbnail, 
      product_description, normal_price, sell_price, discount_percentage, discounted_price) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''',
      [
        wishlistItem.userId,
        wishlistItem.productId,
        wishlistItem.productName,
        wishlistItem.productThumbnail,
        wishlistItem.productDescription,
        wishlistItem.normalPrice,
        wishlistItem.sellPrice,
        wishlistItem.discountPercentage,
        wishlistItem.discountedPrice,
      ],
    );

    return WishlistItem(
      wishlistId: result.insertId,
      userId: wishlistItem.userId,
      productId: wishlistItem.productId,
      productName: wishlistItem.productName,
      productThumbnail: wishlistItem.productThumbnail,
      productDescription: wishlistItem.productDescription,
      normalPrice: wishlistItem.normalPrice,
      sellPrice: wishlistItem.sellPrice,
      discountPercentage: wishlistItem.discountPercentage,
      discountedPrice: wishlistItem.discountedPrice,
    );
  }

  // Fetch wishlist items for a user
  Future<List<WishlistItem>> getWishlistItems(int userId) async {
    final results = await connection.query(
      'SELECT * FROM wishlist WHERE user_id = ?',
      [userId],
    );

    return results.map((row) => WishlistItem.fromMap(row.fields)).toList();
  }

  // Remove an item from the wishlist
  Future<void> removeFromWishlist(int wishlistId) async {
    await connection.query('DELETE FROM wishlist WHERE wishlist_id = ?', [wishlistId]);
  }
}
