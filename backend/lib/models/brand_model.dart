class Brand {
  final int? brandId; // Nullable for auto-incremented IDs
  final String brandName;
  final String? brandThumbnail; // Nullable
  final String? brandDescription; // Nullable

  Brand({
    this.brandId,
    required this.brandName,
    this.brandThumbnail,
    this.brandDescription,
  });

  // Convert Brand object to a Map for database operations
  Map<String, dynamic> toMap() {
    return {
      'brand_id': brandId,
      'brand_name': brandName,
      'brand_thumbnail': brandThumbnail,
      'brand_description': brandDescription,
    };
  }

  // Create a Brand object from a database result
  factory Brand.fromMap(Map<String, dynamic> map) {
    return Brand(
      brandId: map['brand_id'],
      brandName: map['brand_name'],
      brandThumbnail: map['brand_thumbnail'],
      brandDescription: map['brand_description'],
    );
  }
}
