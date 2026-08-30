class WishlistItem {
  final int? wishlistId;
  final int userId;
  final int productId;
  final String productName;
  final String? productThumbnail;
  final String? productDescription;
  final double normalPrice;
  final double sellPrice;
  final double? discountPercentage;
  final double? discountedPrice;

  WishlistItem({
    this.wishlistId,
    required this.userId,
    required this.productId,
    required this.productName,
    this.productThumbnail,
    this.productDescription,
    required this.normalPrice,
    required this.sellPrice,
    this.discountPercentage,
    this.discountedPrice,
  });

  // Convert to Map for database
  Map<String, dynamic> toMap() {
    return {
      'wishlist_id': wishlistId,
      'user_id': userId,
      'product_id': productId,
      'product_name': productName,
      'product_thumbnail': productThumbnail,
      'product_description': productDescription,
      'normal_price': normalPrice,
      'sell_price': sellPrice,
      'discount_percentage': discountPercentage,
      'discounted_price': discountedPrice,
    };
  }

  // Create object from database result
  factory WishlistItem.fromMap(Map<String, dynamic> map) {
    return WishlistItem(
      wishlistId: map['wishlist_id'],
      userId: map['user_id'],
      productId: map['product_id'],
      productName: map['product_name'],
      productThumbnail: map['product_thumbnail'],
      productDescription: map['product_description'],
      normalPrice: map['normal_price'],
      sellPrice: map['sell_price'],
      discountPercentage: map['discount_percentage'],
      discountedPrice: map['discounted_price'],
    );
  }
}
