import 'package:mysql1/mysql1.dart';
import '../models/categories_model.dart';

class CategoryService {
  final MySqlConnection connection;

  CategoryService(this.connection);

  // Add a new category to the database
  Future<Category> addCategory(Category category) async {
    final result = await connection.query(
      'INSERT INTO categories (category_name, category_thumbnail, category_description) VALUES (?, ?, ?)',
      [
        category.categoryName,
        category.categoryThumbnail,
        category.categoryDescription
      ],
    );

    return Category(
      categoryId: result.insertId,
      categoryName: category.categoryName,
      categoryThumbnail: category.categoryThumbnail,
      categoryDescription: category.categoryDescription,
    );
  }

  // Retrieve all categories
  Future<List<Category>> getAllCategories() async {
    final results = await connection.query('SELECT * FROM categories');
    return results.map((row) => Category.fromMap(row.fields)).toList();
  }

  // Retrieve a single category by ID
  Future<Category?> getCategoryById(int categoryId) async {
    final results = await connection.query(
      'SELECT * FROM categories WHERE category_id = ?',
      [categoryId],
    );

    if (results.isEmpty) {
      return null;
    }

    return Category.fromMap(results.first.fields);
  }
   Future<bool> deleteCategory(int categoryId) async {
    final result = await connection.query(
      'DELETE FROM categories  WHERE category_id = ?',
      [categoryId],
    );

    return result.affectedRows! > 0; // Returns true if a row was deleted
  }
}
