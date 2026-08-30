import 'package:mysql1/mysql1.dart';

class ReviewService {
  final MySqlConnection connection;

  ReviewService(this.connection);

  // Add a new review
  Future<bool> addReview({
    required int productId,
    required int userId,
    required String userName,
    required String comment,
    required double rating,
  }) async {
    try {
      final result = await connection.query(
        'INSERT INTO reviews (product_id, user_id, user_name, comment, rating, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [productId, userId, userName, comment, rating],
      );

      return result.affectedRows! > 0;
    } catch (e) {
      print('Error adding review: $e');
      return false;
    }
  }

  // Get all reviews (admin or product-specific)
  Future<List<Map<String, dynamic>>> getReviews({int? productId}) async {
    try {
      final results = await connection.query(
        productId != null
            ? 'SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC'
            : 'SELECT * FROM reviews ORDER BY created_at DESC',
        productId != null ? [productId] : [],
      );

      // Explicitly convert each row to a safe Map for JSON serialization
      final List<Map<String, dynamic>> reviewsList = [];
      
      for (var row in results) {
        final Map<String, dynamic> safeMap = {};
        
        // Manually process each field with proper type conversion
        safeMap['review_id'] = row['review_id'];
        safeMap['product_id'] = row['product_id'];
        safeMap['user_id'] = row['user_id'];
        safeMap['user_name'] = row['user_name'];
        safeMap['comment'] = row['comment'];
        safeMap['rating'] = row['rating'];
        
        // Convert DateTime to string
        if (row['created_at'] is DateTime) {
          safeMap['created_at'] = (row['created_at'] as DateTime).toIso8601String();
        } else {
          safeMap['created_at'] = DateTime.now().toIso8601String();
        }
        
        if (row['updated_at'] is DateTime) {
          safeMap['updated_at'] = (row['updated_at'] as DateTime).toIso8601String();
        } else {
          safeMap['updated_at'] = DateTime.now().toIso8601String();
        }
        
        reviewsList.add(safeMap);
      }
      
      return reviewsList;
    } catch (e) {
      print('❌ Error fetching reviews from DB: $e');
      rethrow;
    }
  }
}