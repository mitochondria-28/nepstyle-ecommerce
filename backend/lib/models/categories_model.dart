class Category {
  final int? categoryId;
  final String categoryName;
  final String? categoryThumbnail; // Nullable
  final String? categoryDescription; // Nullable

  Category({
    this.categoryId,
    required this.categoryName,
    this.categoryThumbnail,
    this.categoryDescription,
  });

  // Convert Category object to a Map for database operations
  Map<String, dynamic> toMap() {
    return {
      'category_id': categoryId,
      'category_name': categoryName,
      'category_thumbnail': categoryThumbnail,
      'category_description': categoryDescription,
    };
  }

  // Create a Category object from a database result (row)
  factory Category.fromMap(Map<String, dynamic> map) {
    return Category(
      categoryId: map['category_id'],
      categoryName: map['category_name'],
      categoryThumbnail: map['category_thumbnail'],
      categoryDescription: map['category_description'],
    );
  }
}
