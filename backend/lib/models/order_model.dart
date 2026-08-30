class Order {
  final int? orderId;
  final int userId;
  final double totalAmount;
  final String orderStatus;
  final DateTime orderDate;
  final String paymentMethod;
  final String deliveryLocation;

  Order({
    this.orderId,
    required this.userId,
    required this.totalAmount,
    this.orderStatus = "pending",
    DateTime? orderDate,
    required this.paymentMethod,
    required this.deliveryLocation,
  }) : orderDate = orderDate ?? DateTime.now();

  Map<String, dynamic> toMap() {
    return {
      'order_id': orderId,
      'user_id': userId,
      'total_amount': totalAmount,
      'order_status': orderStatus,
      'order_date': orderDate.toIso8601String(),
      'payment_method': paymentMethod,
      'delivery_location': deliveryLocation,
    };
  }

  static Order fromMap(Map<String, dynamic> map) {
    return Order(
      orderId: map['order_id'],
      userId: map['user_id'],
      totalAmount: map['total_amount'],
      orderStatus: map['order_status'],
      orderDate: DateTime.parse(map['order_date']),
      paymentMethod: map['payment_method'],
      deliveryLocation: map['delivery_location'],
    );
  }
}




class OrderItem {
  final int? orderItemId;
  final int orderId;
  final int productId;
  final int quantity;
  final double price;

  OrderItem({
    this.orderItemId,
    required this.orderId,
    required this.productId,
    required this.quantity,
    required this.price,
  });

  Map<String, dynamic> toMap() {
    return {
      'order_item_id': orderItemId,
      'order_id': orderId,
      'product_id': productId,
      'quantity': quantity,
      'price': price,
    };
  }

  static OrderItem fromMap(Map<String, dynamic> map) {
    return OrderItem(
      orderItemId: map['order_item_id'],
      orderId: map['order_id'],
      productId: map['product_id'],
      quantity: map['quantity'],
      price: map['price'],
    );
  }
}
