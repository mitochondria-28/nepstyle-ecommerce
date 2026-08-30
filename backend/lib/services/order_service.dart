import 'package:mysql1/mysql1.dart';
import '../models/order_model.dart';

class OrderService {
  final MySqlConnection connection;

  OrderService(this.connection);

  Future<int> placeSingleOrder(Order order, List<OrderItem> items) async {
    try {
      await connection.transaction((txn) async {
        var orderResult = await txn.query(
          'INSERT INTO orders (user_id, total_amount, payment_method, delivery_location) VALUES (?, ?, ?, ?)',
          [order.userId, order.totalAmount, order.paymentMethod, order.deliveryLocation],
        );
        int orderId = orderResult.insertId!;

        for (var item in items) {
          await txn.query(
            'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
            [orderId, item.productId, item.quantity, item.price],
          );
        }
      });
      return 1;
    } catch (e) {
      print("Order placement failed: $e");
      return 0;
    }
  }

  Future<bool> placeCustomOrder(int userId, List<Map<String, dynamic>> products, String paymentMethod, String deliveryLocation) async {
    try {
      double totalAmount = 0;
      List<Map<String, dynamic>> orderItems = [];

      for (var item in products) {
        int productId = item['product_id'];
        int quantity = item['quantity'];

        var result = await connection.query(
            "SELECT sell_price FROM products WHERE product_id = ?", [productId]);

        if (result.isEmpty) {
          return false;
        }

        double price = result.first['sell_price'];
        double totalPrice = price * quantity;
        totalAmount += totalPrice;

        orderItems.add({
          'product_id': productId,
          'quantity': quantity,
          'price': price,
          'total_price': totalPrice
        });
      }

      var orderResult = await connection.query(
          "INSERT INTO orders (user_id, total_amount, payment_method, delivery_location) VALUES (?, ?, ?, ?)",
          [userId, totalAmount, paymentMethod, deliveryLocation]);

      int orderId = orderResult.insertId!;

      for (var item in orderItems) {
        await connection.query(
            "INSERT INTO order_items (order_id, product_id, quantity, price, total_price) VALUES (?, ?, ?, ?, ?)",
            [orderId, item['product_id'], item['quantity'], item['price'], item['total_price']]);
      }

      return true;
    } catch (e) {
      print("Error placing custom order: $e");
      return false;
    }
  }

  Future<int> placeCartOrder(int userId, String paymentMethod, String deliveryLocation) async {
    try {
      var cartResults = await connection.query(
        'SELECT product_id, quantity, sell_price FROM cart WHERE user_id = ?',
        [userId],
      );

      if (cartResults.isEmpty) {
        return 0;
      }

      double totalAmount = 0;
      List<OrderItem> orderItems = [];

      for (var row in cartResults) {
        totalAmount += row['quantity'] * row['sell_price'];
        orderItems.add(OrderItem(
          orderId: 0,
          productId: row['product_id'],
          quantity: row['quantity'],
          price: row['sell_price'],
        ));
      }

      var orderResult = await connection.query(
        'INSERT INTO orders (user_id, total_amount, payment_method, delivery_location) VALUES (?, ?, ?, ?)',
        [userId, totalAmount, paymentMethod, deliveryLocation],
      );
      int orderId = orderResult.insertId!;

      for (var item in orderItems) {
        await connection.query(
          'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
          [orderId, item.productId, item.quantity, item.price],
        );
      }

      await connection.query('DELETE FROM cart WHERE user_id = ?', [userId]);

      return 1;
    } catch (e) {
      print("Order placement from cart failed: $e");
      return 0;
    }
  }
  // Fetch all orders (For Admin Dashboard)
Future<List<Map<String, dynamic>>> getAllOrders() async {
  try {
    var results = await connection.query(
      'SELECT * FROM orders ORDER BY order_date DESC'
    );

    List<Map<String, dynamic>> orders = [];
    for (var row in results) {
      orders.add({
        'order_id': row['order_id'],
        'user_id': row['user_id'],
        'total_amount': row['total_amount'],
        'order_status': row['order_status'],
        'order_date': row['order_date'].toString(),
        'payment_method': row['payment_method'],
        'delivery_location': row['delivery_location'],
      });
    }
    return orders;
  } catch (e) {
    print("Error fetching all orders: $e");
    return [];
  }
}

// Fetch orders for a specific user
Future<List<Map<String, dynamic>>> getUserOrders(int userId) async {
  try {
    var results = await connection.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY order_date DESC',
      [userId]
    );

    List<Map<String, dynamic>> orders = [];
    for (var row in results) {
      orders.add({
        'order_id': row['order_id'],
        'total_amount': row['total_amount'],
        'order_status': row['order_status'],
        'order_date': row['order_date'].toString(),
        'payment_method': row['payment_method'],
        'delivery_location': row['delivery_location'],
      });
    }
    return orders;
  } catch (e) {
    print("Error fetching user orders: $e");
    return [];
  }
}
Future<int> placeSelectedCartOrder(int userId, List<int> selectedProductIds, String paymentMethod, String deliveryLocation) async {
  try {
    if (selectedProductIds.isEmpty) return 0;

    String placeholders = selectedProductIds.map((_) => '?').join(',');
    List<dynamic> queryParams = [userId, ...selectedProductIds];

    var cartResults = await connection.query(
      'SELECT product_id, quantity, sell_price FROM cart WHERE user_id = ? AND product_id IN ($placeholders)',
      queryParams,
    );

    if (cartResults.isEmpty) {
      return 0;
    }

    double totalAmount = 0;
    List<OrderItem> orderItems = [];

    for (var row in cartResults) {
      totalAmount += row['quantity'] * row['sell_price'];
      orderItems.add(OrderItem(
        orderId: 0,
        productId: row['product_id'],
        quantity: row['quantity'],
        price: row['sell_price'],
      ));
    }

    var orderResult = await connection.query(
      'INSERT INTO orders (user_id, total_amount, payment_method, delivery_location) VALUES (?, ?, ?, ?)',
      [userId, totalAmount, paymentMethod, deliveryLocation],
    );
    int orderId = orderResult.insertId!;

    for (var item in orderItems) {
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.productId, item.quantity, item.price],
      );
    }

    // Delete only selected items from the cart
    for (var productId in selectedProductIds) {
      await connection.query(
        'DELETE FROM cart WHERE user_id = ? AND product_id = ?',
        [userId, productId],
      );
    }

    return 1;
  } catch (e) {
    print("Selected cart order placement failed: $e");
    return 0;
  }
}

  
}
