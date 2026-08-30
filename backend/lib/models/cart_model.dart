class CartItem {
  final int? cartId;
  final int userId;
  final int productId;
  final String productName;
  final String? productThumbnail;
  final String? productDescription;
  final double normalPrice;
  final double sellPrice;
  final double? discountPercentage;
  final double? discountedPrice;
  final int quantity;
  final double? totalPrice;

  CartItem({
    this.cartId,
    required this.userId,
    required this.productId,
    required this.productName,
    this.productThumbnail,
    this.productDescription,
    required this.normalPrice,
    required this.sellPrice,
    this.discountPercentage,
    this.discountedPrice,
    required this.quantity,
    this.totalPrice,
  });

  // Convert to Map for database
  Map<String, dynamic> toMap() {
    return {
      'cart_id': cartId,
      'user_id': userId,
      'product_id': productId,
      'product_name': productName,
      'product_thumbnail': productThumbnail,
      'product_description': productDescription,
      'normal_price': normalPrice,
      'sell_price': sellPrice,
      'discount_percentage': discountPercentage,
      'discounted_price': discountedPrice,
      'quantity': quantity,
    };
  }

  // Create object from database result
  factory CartItem.fromMap(Map<String, dynamic> map) {
    return CartItem(
      cartId: map['cart_id'],
      userId: map['user_id'],
      productId: map['product_id'],
      productName: map['product_name'],
      productThumbnail: map['product_thumbnail'],
      productDescription: map['product_description'],
      normalPrice: map['normal_price'],
      sellPrice: map['sell_price'],
      discountPercentage: map['discount_percentage'],
      discountedPrice: map['discounted_price'],
      quantity: map['quantity'],
      totalPrice: map['total_price'],
    );
  }
}
