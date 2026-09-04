import 'package:mysql1/mysql1.dart';
import '../database/db.dart';
import 'package:nepstyle_cms/models/products_model.dart';

class ProductService {
  final ManagedConnection connection;

  ProductService(this.connection);

  // Add a new product to the database
  Future<Product> addProduct(Product product) async {
    final result = await connection.query(
      'INSERT INTO products (category_id, brand_id, product_name, category_name, brand_name, product_description, product_thumbnail, normal_price, sell_price, total_product_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?,?,?)',
      [
        product.categoryId,
        product.brandId,
        product.productName,
        product.categoryName,
        product.brandName,
        product.productDescription,
        product.productThumbnail,
        product.normalPrice,
        product.sellPrice,
        product.totalProductCount,
      ],
    );

    return Product(
      productId: result.insertId,
      categoryId: product.categoryId,
      brandId: product.brandId,
      productName: product.productName,
      categoryName: product.categoryName,
      brandName: product.brandName,
      productDescription: product.productDescription,
      productThumbnail: product.productThumbnail,
      normalPrice: product.normalPrice,
      sellPrice: product.sellPrice,
      totalProductCount: product.totalProductCount,
    );
  }

  // Retrieve all products
  Future<List<Product>> getAllProducts() async {
    final results = await connection.query('SELECT * FROM products');
    return results.map((row) => Product.fromMap(row.fields)).toList();
  }

  // Retrieve products by category ID
  Future<List<Product>> getProductsByCategoryId(int categoryId) async {
    final results = await connection.query(
      'SELECT * FROM products WHERE category_id = ?',
      [categoryId],
    );
    return results.map((row) => Product.fromMap(row.fields)).toList();
  }

  // Retrieve products by brand ID
  Future<List<Product>> getProductsByBrandId(int brandId) async {
    final results = await connection.query(
      'SELECT * FROM products WHERE brand_id = ?',
      [brandId],
    );
    return results.map((row) => Product.fromMap(row.fields)).toList();
  }

  // delet a product from the database.
  Future<bool> deleteProduct(int productId) async {
    try {
      // Start a transaction to ensure data consistency
      await connection.transaction((ctx) async {
        await ctx.query('DELETE FROM cart WHERE product_id = ?', [productId]);
        await ctx
            .query('DELETE FROM wishlist WHERE product_id = ?', [productId]);
        await ctx.query(
            'DELETE FROM user_activity WHERE product_id = ?', [productId]);

        // Delete dependent rows in flash_sale_products first
        await ctx.query(
          'DELETE FROM flash_sale_products WHERE product_id = ?',
          [productId],
        );

        // Delete the product from products
        final result = await ctx.query(
          'DELETE FROM products WHERE product_id = ?',
          [productId],
        );

        // Check if the product was deleted
        if (result.affectedRows! > 0) {
          print('Product deleted successfully');
        } else {
          print('Product not found or already deleted');
        }
      });

      return true; // Success
    } catch (e) {
      print('Failed to delete product: $e');
      return false; // Failure
    }
  }

  Future<List<Map<String, dynamic>>> getTrendingProducts() async {
    final results = await connection.query('''
    SELECT p.*, COUNT(ua.product_id) as popularity 
    FROM user_activity ua
    JOIN products p ON ua.product_id = p.product_id
    WHERE ua.action_type IN ('view', 'purchase')
    GROUP BY ua.product_id
    ORDER BY popularity DESC
    LIMIT 10;
    ''');

    return results.map((row) {
      final map = Map<String, dynamic>.from(row.fields);
      map.forEach((key, value) {
        if (value is DateTime) map[key] = value.toIso8601String();
      });
      return map;
    }).toList();
  }
}
