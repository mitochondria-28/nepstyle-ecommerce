class Review {
  final int id;
  final int productId;
  final int userId;
  final String userName;
  final String comment;
  final double rating;
  final DateTime createdAt;

  Review({
    required this.id,
    required this.productId,
    required this.userId,
    required this.userName,
    required this.comment,
    required this.rating,
    required this.createdAt,
  });

  // Factory constructor to create Review from JSON
  factory Review.fromJson(Map<String, dynamic> json) {
    return Review(
      id: json['review_id'] ?? 0,
      productId: json['product_id'] ?? 0,
      userId: json['user_id'] ?? 0,
      userName: json['user_name'] ?? '',
      comment: json['comment'] ?? '',
      rating: (json['rating'] is int) 
          ? (json['rating'] as int).toDouble() 
          : (json['rating'] ?? 0.0),
      createdAt: json['created_at'] is String 
          ? DateTime.parse(json['created_at']) 
          : (json['created_at'] ?? DateTime.now()),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'product_id': productId,
    'user_id': userId,
    'user_name': userName,
    'comment': comment,
    'rating': rating,
    'created_at': createdAt.toIso8601String(),
  };
}