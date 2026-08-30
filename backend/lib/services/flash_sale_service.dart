import 'package:mysql1/mysql1.dart';

import '../models/flash_sale_products_model.dart';

class FlashSaleProductService {
  final MySqlConnection connection;

  FlashSaleProductService(this.connection);

  // Add a new flash sale product
  Future<FlashSaleProduct> addFlashSaleProduct(FlashSaleProduct flashSaleProduct) async {
    final result = await connection.query(
      '''INSERT INTO flash_sale_products 
      (product_id, category_id, brand_id, product_name,category_name, brand_name, product_description, product_thumbnail, normal_price, sell_price, total_product_count, discount_percentage, discounted_price) 
      VALUES (?, ?, ?, ?,?,?, ?, ?, ?, ?, ?, ?, ?)''',
      [
        flashSaleProduct.productId,
        flashSaleProduct.categoryId,
        flashSaleProduct.brandId,
        flashSaleProduct.productName,
        flashSaleProduct.categoryName,
        flashSaleProduct.brandName,
        flashSaleProduct.productDescription,
        flashSaleProduct.productThumbnail,
        flashSaleProduct.normalPrice,
        flashSaleProduct.sellPrice,
        flashSaleProduct.totalProductCount,
        flashSaleProduct.discountPercentage,
        flashSaleProduct.discountedPrice,
      ],
    );

    return FlashSaleProduct(
      flashSaleId: result.insertId,
      productId: flashSaleProduct.productId,
      categoryId: flashSaleProduct.categoryId,
      brandId: flashSaleProduct.brandId,
      productName: flashSaleProduct.productName,
      categoryName: flashSaleProduct.categoryName,
      brandName: flashSaleProduct.brandName,
      productDescription: flashSaleProduct.productDescription,
      productThumbnail: flashSaleProduct.productThumbnail,
      normalPrice: flashSaleProduct.normalPrice,
      sellPrice: flashSaleProduct.sellPrice,
      totalProductCount: flashSaleProduct.totalProductCount,
      discountPercentage: flashSaleProduct.discountPercentage,
      discountedPrice: flashSaleProduct.discountedPrice,
    );
  }

  // Retrieve all flash sale products
  Future<List<FlashSaleProduct>> getAllFlashSaleProducts() async {
    final results = await connection.query('SELECT * FROM flash_sale_products');
    return results.map((row) => FlashSaleProduct.fromMap(row.fields)).toList();
  }
   Future<bool> deleteFlashSale(int flashSaleId) async {
    final result = await connection.query(
      'DELETE FROM flash_sale_products WHERE flash_sale_id = ?',
      [flashSaleId],
    );

    return result.affectedRows! > 0; // Returns true if a row was deleted
  }
}
