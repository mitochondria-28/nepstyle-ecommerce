class FlashSaleProduct {
  final int? flashSaleId;
  final int productId;
  final int categoryId;
  final int brandId;
  final String productName;
  final String categoryName;
  final String brandName;
  final String? productDescription;
  final String? productThumbnail;
  final dynamic normalPrice;
  final dynamic sellPrice;
  final dynamic totalProductCount;
  final dynamic discountPercentage;
  final dynamic discountedPrice;

  FlashSaleProduct({
    this.flashSaleId,
    required this.productId,
    required this.categoryId,
    required this.brandId,
    required this.productName,
    required this.categoryName,
    required this.brandName,
    this.productDescription,
    this.productThumbnail,
    required this.normalPrice,
    required this.sellPrice,
    required this.totalProductCount,
    required this.discountPercentage,
    required this.discountedPrice,
  });

  // Convert to Map for database
  Map<String, dynamic> toMap() {
    return {
      'flash_sale_id': flashSaleId,
      'product_id': productId,
      'category_id': categoryId,
      'brand_id': brandId,
      'product_name': productName,
      'category_name': categoryName,
      'brand_name': brandName,
      'product_description': productDescription,
      'product_thumbnail': productThumbnail,
      'normal_price': normalPrice,
      'sell_price': sellPrice,
      'total_product_count': totalProductCount,
      'discount_percentage': discountPercentage,
      'discounted_price': discountedPrice,
    };
  }

  // Create object from database result
  factory FlashSaleProduct.fromMap(Map<String, dynamic> map) {
    return FlashSaleProduct(
      flashSaleId: map['flash_sale_id'],
      productId: map['product_id'],
      categoryId: map['category_id'],
      brandId: map['brand_id'],
      productName: map['product_name'],
      categoryName: map['category_name'],
      brandName: map['brand_name'],
      productDescription: map['product_description'],
      productThumbnail: map['product_thumbnail'],
      normalPrice: map['normal_price'],
      sellPrice: map['sell_price'],
      totalProductCount: map['total_product_count'],
      discountPercentage: map['discount_percentage'],
      discountedPrice: map['discounted_price'],
    );
  }
}
