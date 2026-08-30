import 'dart:convert';
import 'dart:io';
import 'package:mime/mime.dart';
import 'package:mysql1/mysql1.dart';
import 'package:shelf/shelf.dart';
import 'package:shelf_router/shelf_router.dart';
import '../models/categories_model.dart';
import '../services/category_service.dart';

class CategoryRoutes {
  final CategoryService categoryService;
  final MySqlConnection connection;

  CategoryRoutes(this.categoryService, this.connection);

  Router get router {
    final router = Router();

    // Add a new category
    router.post('/add', (Request request) async {
      try {
        // Read and decode the request body
        final payload = await request.readAsString();
        final data = jsonDecode(payload) as Map<String, dynamic>;

        // Validate input fields
        final categoryName = data['category_name']?.trim();
        final thumbnailUrl = data['thumbnail_url']?.trim();
        final categoryDescription = data['category_description']?.trim();

        if (categoryName == null || categoryName.isEmpty) {
          return Response(
            400,
            body: jsonEncode({
              'status': false,
              'message': 'Category name is required',
            }),
          );
        }

        // Create a category object
        final category = Category(
          categoryName: categoryName,
          categoryThumbnail: thumbnailUrl,
          categoryDescription: categoryDescription,
        );

        // Add the category to the database
        final addedCategory = await categoryService.addCategory(category);

        // Respond with the added category
        return Response.ok(jsonEncode({
          'status': true,
          'message': 'Category added successfully',
          'category': addedCategory.toMap(),
        }));
      } catch (e) {
        // Catch and respond with error
        return Response(
          500,
          body: jsonEncode({
            'status': false,
            'message': 'Failed to add category: ${e.toString()}',
          }),
        );
      }
    });

    // Retrieve all categories
    router.get('/all', (Request request) async {
      try {
        final categories = await categoryService.getAllCategories();
        return Response.ok(jsonEncode({
          'status': true,
          'categories': categories.map((cat) => cat.toMap()).toList(),
        }));
      } catch (e) {
        return Response(500,
            body: jsonEncode({
              'status': false,
              'message': 'Failed to fetch categories: ${e.toString()}',
            }));
      }
    });

    // Retrieve a single category by ID
    router.get('/<id|[0-9]+>', (Request request, String id) async {
      try {
        final categoryId = int.parse(id);
        final category = await categoryService.getCategoryById(categoryId);

        if (category == null) {
          return Response(404,
              body: jsonEncode({
                'status': false,
                'message': 'Category not found',
              }));
        }

        return Response.ok(jsonEncode({
          'status': true,
          'category': category.toMap(),
        }));
      } catch (e) {
        return Response(500,
            body: jsonEncode({
              'status': false,
              'message': 'Failed to fetch category: ${e.toString()}',
            }));
      }
    });
    router.delete('/delete/<categoryId>',
        (Request request, String categoryId) async {
      try {
        final int id = int.parse(categoryId);
        final bool isDeleted = await categoryService.deleteCategory(id);

        if (isDeleted) {
          return Response.ok(jsonEncode({
            'status': true,
            'message': 'Category deleted successfully',
          }));
        } else {
          return Response(404,
              body: jsonEncode({
                'status': false,
                'message': 'Category not found',
              }));
        }
      } catch (e) {
        return Response(500,
            body: jsonEncode({
              'status': false,
              'message': 'Failed to delete Category: ${e.toString()}',
            }));
      }
    });
    //delete category
    router.delete('/delete/<category_id>',
        (Request request, String categoryId) async {
      try {
        final int id = int.parse(categoryId);
        final bool isDeleted = await categoryService.deleteCategory(id);

        if (isDeleted) {
          return Response.ok(jsonEncode({
            'status': true,
            'message': 'Category  deleted successfully',
          }));
        } else {
          return Response(404,
              body: jsonEncode({
                'status': false,
                'message': 'Category Product  not found',
              }));
        }
      } catch (e) {
        return Response(500,
            body: jsonEncode({
              'status': false,
              'message': 'Failed to delete category : ${e.toString()}',
            }));
      }
    });

    // Route for searching categories
    router.get('/search/categories/<query>',
        (Request request, String query) async {
      try {
        // Perform full-text search on category name and description
        final results = await connection.query(
            'SELECT * FROM categories WHERE MATCH(category_name, category_description) AGAINST(? IN NATURAL LANGUAGE MODE) LIMIT 10',
            [query]);

        final categories = results.map((row) {
          return {
            'category_id': row['category_id'],
            'category_name': row['category_name'],
            'category_description': row['category_description'],
            'category_thumbnail': row['category_thumbnail'],
          };
        }).toList();

        return Response.ok(jsonEncode({
          'status': true,
          'categories': categories,
        }));
      } catch (e) {
        return Response(500,
            body: jsonEncode({
              'status': false,
              'message': 'Failed to fetch categories: ${e.toString()}',
            }));
      }
    });

    return router;
  }
}
