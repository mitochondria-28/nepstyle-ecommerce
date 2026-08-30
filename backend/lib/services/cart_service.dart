import 'package:mysql1/mysql1.dart';
import '../models/cart_model.dart';

class CartService {
  final MySqlConnection connection;

  CartService(this.connection);

  // Add a product or flash-sale product to the cart
  Future<CartItem> addToCart(CartItem cartItem) async {
    // Check if the product is already in the cart for the user
    final existingCart = await connection.query(
      'SELECT * FROM cart WHERE user_id = ? AND product_id = ?',
      [cartItem.userId, cartItem.productId],
    );

    if (existingCart.isNotEmpty) {
      // Update quantity if the product exists
      final updatedQuantity = existingCart.first['quantity'] + cartItem.quantity;
      await connection.query(
        'UPDATE cart SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE cart_id = ?',
        [updatedQuantity, existingCart.first['cart_id']],
      );

      // Return the updated cart item
      final updatedCart = await connection.query(
        'SELECT * FROM cart WHERE cart_id = ?',
        [existingCart.first['cart_id']],
      );

      return CartItem.fromMap(updatedCart.first.fields);
    }

    // Insert new product into cart
    final result = await connection.query(
      '''INSERT INTO cart (user_id, product_id, product_name, product_thumbnail, product_description, 
      normal_price, sell_price, discount_percentage, discounted_price, quantity) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
      [
        cartItem.userId,
        cartItem.productId,
        cartItem.productName,
        cartItem.productThumbnail,
        cartItem.productDescription,
        cartItem.normalPrice,
        cartItem.sellPrice,
        cartItem.discountPercentage,
        cartItem.discountedPrice,
        cartItem.quantity,
      ],
    );

    return CartItem(
      cartId: result.insertId,
      userId: cartItem.userId,
      productId: cartItem.productId,
      productName: cartItem.productName,
      productThumbnail: cartItem.productThumbnail,
      productDescription: cartItem.productDescription,
      normalPrice: cartItem.normalPrice,
      sellPrice: cartItem.sellPrice,
      discountPercentage: cartItem.discountPercentage,
      discountedPrice: cartItem.discountedPrice,
      quantity: cartItem.quantity,
    );
  }

  // Fetch cart items for a user
  Future<List<CartItem>> getCartItems(int userId) async {
    final results = await connection.query(
      'SELECT * FROM cart WHERE user_id = ?',
      [userId],
    );

    return results.map((row) => CartItem.fromMap(row.fields)).toList();
  }

  // Remove an item from the cart
  Future<void> removeFromCart(int cartId) async {
    await connection.query('DELETE FROM cart WHERE cart_id = ?', [cartId]);
  }

  // Update cart quantity
  Future<void> updateCartQuantity(int cartId, int quantity) async {
    await connection.query(
      'UPDATE cart SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE cart_id = ?',
      [quantity, cartId],
    );
  }
}
