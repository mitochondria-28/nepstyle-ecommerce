class ProductCategoryModel {
  final int? productId;
  final String productName;
  final String? productDescription; // Nullable
  final String? productThumbnail; // Nullable
  final double normalPrice;
  final double sellPrice;
  final int totalProductCount;
  final int categoryId; // Foreign Key (Category ID)
  final String categoryName;

  ProductCategoryModel({
    this.productId,
    required this.productName,
    this.productDescription,
    this.productThumbnail,
    required this.normalPrice,
    required this.sellPrice,
    required this.totalProductCount,
    required this.categoryId,
    required this.categoryName,
  });

  // Convert Product object to Map for database operations
  Map<String, dynamic> toMap() {
    return {
      'product_id': productId,
      'product_name': productName,
      'product_description': productDescription,
      'product_thumbnail': productThumbnail,
      'normal_price': normalPrice,
      'sell_price': sellPrice,
      'total_product_count': totalProductCount,
      'category_id': categoryId,
      'category_name': categoryName,
    };
  }

  // Create a Product object from a database result (row)
  factory ProductCategoryModel.fromMap(Map<String, dynamic> map) {
    return ProductCategoryModel(
      productId: map['product_id'],
      productName: map['product_name'],
      productDescription: map['product_description'],
      productThumbnail: map['product_thumbnail'],
      normalPrice: map['normal_price'],
      sellPrice: map['sell_price'],
      totalProductCount: map['total_product_count'],
      categoryId: map['category_id'],
      categoryName: map['category_name'],
    );
  }
}
