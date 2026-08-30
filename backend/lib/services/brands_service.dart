import 'package:mysql1/mysql1.dart';
import '../models/brand_model.dart';

class BrandService {
  final MySqlConnection connection;

  BrandService(this.connection);

  // Add a new brand to the database
  Future<Brand> addBrand(Brand brand) async {
    final result = await connection.query(
      'INSERT INTO brands (brand_name, brand_thumbnail, brand_description) VALUES (?, ?, ?)',
      [brand.brandName, brand.brandThumbnail, brand.brandDescription],
    );

    return Brand(
      brandId: result.insertId,
      brandName: brand.brandName,
      brandThumbnail: brand.brandThumbnail,
      brandDescription: brand.brandDescription,
    );
  }

  // Retrieve all brands
  Future<List<Brand>> getAllBrands() async {
    final results = await connection.query('SELECT * FROM brands');
    return results.map((row) => Brand.fromMap(row.fields)).toList();
  }

  // Retrieve a single brand by ID
  Future<Brand?> getBrandById(int brandId) async {
    final results = await connection.query(
      'SELECT * FROM brands WHERE brand_id = ?',
      [brandId],
    );

    if (results.isEmpty) {
      return null;
    }

    return Brand.fromMap(results.first.fields);
  }
    // Delete a brand by ID
  Future<bool> deleteBrand(int brandId) async {
    final result = await connection.query(
      'DELETE FROM brands WHERE brand_id = ?',
      [brandId],
    );

    return result.affectedRows! > 0; // Returns true if a row was deleted
  }

}
