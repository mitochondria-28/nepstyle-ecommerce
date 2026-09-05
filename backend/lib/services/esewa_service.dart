import 'dart:convert';
import 'dart:math';
import 'package:crypto/crypto.dart';
import 'package:http/http.dart' as http;
import '../database/db.dart';

class EsewaService {
  final ManagedConnection connection;

  static const String _productCode = 'INTENT';
  static const String _accessKey = 'LB0REg8HUSw3MTYrI1s6JTE8Kyc6JyAqJiA3MQ==';
  static const String _bookUrl =
      'https://rc-checkout.esewa.com.np/api/client/intent/payment/book';
  static const String _statusUrl =
      'https://rc-checkout.esewa.com.np/api/client/intent/payment/status';
  static const String _cancelUrl =
      'https://rc-checkout.esewa.com.np/api/client/intent/payment/cancel';

  EsewaService(this.connection) {
    _ensureTable();
  }

  Future<void> _ensureTable() async {
    await connection.query('''
      CREATE TABLE IF NOT EXISTS esewa_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        booking_id VARCHAR(255),
        correlation_id VARCHAR(255),
        transaction_uuid VARCHAR(255),
        amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'BOOKED',
        cart_type VARCHAR(50),
        cart_user_id INT,
        cart_product_ids TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    ''');
  }

  String _generateSignature(String message) {
    final keyBytes = utf8.encode(_accessKey);
    final messageBytes = utf8.encode(message);
    final hmac = Hmac(sha256, keyBytes);
    final digest = hmac.convert(messageBytes);
    return base64.encode(digest.bytes);
  }

  String _generateTransactionUuid() {
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final random = Random().nextInt(9999);
    return 'txn-$timestamp-$random';
  }

  Future<Map<String, dynamic>> initiatePayment({
    required double amount,
    required int orderId,
    required String callbackUrl,
    required String redirectUrl,
    Map<String, dynamic>? properties,
  }) async {
    final transactionUuid = _generateTransactionUuid();
    const signedFields = 'product_code,amount,transaction_uuid';
    final message =
        'product_code=$_productCode,amount=$amount,transaction_uuid=$transactionUuid';
    final signature = _generateSignature(message);

    final payload = {
      'product_code': _productCode,
      'amount': amount,
      'transaction_uuid': transactionUuid,
      'signed_field_names': signedFields,
      'signature': signature,
      'callback_url': callbackUrl,
      'redirect_url': redirectUrl,
      'properties': properties ?? {},
    };

    try {
      final response = await http.post(
        Uri.parse(_bookUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(payload),
      );

      final responseData = jsonDecode(response.body) as Map<String, dynamic>;

      if (responseData['code'] == 'IP-201') {
        final bookingId = responseData['data']['booking_id'] as String;
        final correlationId = responseData['data']['correlation_id'] as String;
        final deeplink = responseData['data']['deeplink'] as String;

        await connection.query(
          '''INSERT INTO esewa_payments
             (order_id, booking_id, correlation_id, transaction_uuid, amount, status)
             VALUES (?, ?, ?, ?, ?, 'BOOKED')''',
          [orderId, bookingId, correlationId, transactionUuid, amount],
        );

        return {
          'success': true,
          'booking_id': bookingId,
          'correlation_id': correlationId,
          'deeplink': deeplink,
        };
      } else {
        return {
          'success': false,
          'error': responseData['error_message'] ?? 'Failed to initiate payment',
        };
      }
    } catch (e) {
      print('eSewa book API error: $e');
      return {'success': false, 'error': 'Could not reach eSewa service'};
    }
  }

  Future<Map<String, dynamic>> checkStatus(
      String bookingId, String correlationId) async {
    const signedFields = 'booking_id,product_code,correlation_id';
    final message =
        'booking_id=$bookingId,product_code=$_productCode,correlation_id=$correlationId';
    final signature = _generateSignature(message);

    final payload = {
      'booking_id': bookingId,
      'product_code': _productCode,
      'correlation_id': correlationId,
      'signed_field_names': signedFields,
      'signature': signature,
    };

    try {
      final response = await http.post(
        Uri.parse(_statusUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(payload),
      );
      return jsonDecode(response.body) as Map<String, dynamic>;
    } catch (e) {
      print('eSewa status API error: $e');
      return {'code': 'ERROR', 'error_message': 'Could not reach eSewa service'};
    }
  }

  Future<Map<String, dynamic>> cancelPayment(String bookingId) async {
    const signedFields = 'booking_id,product_code';
    final message =
        'booking_id=$bookingId,product_code=$_productCode';
    final signature = _generateSignature(message);

    final payload = {
      'booking_id': bookingId,
      'product_code': _productCode,
      'signed_field_names': signedFields,
      'signature': signature,
    };

    try {
      final response = await http.post(
        Uri.parse(_cancelUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(payload),
      );
      return jsonDecode(response.body) as Map<String, dynamic>;
    } catch (e) {
      print('eSewa cancel API error: $e');
      return {'code': 'ERROR', 'error_message': 'Could not reach eSewa service'};
    }
  }

  Future<Map<String, dynamic>?> getEsewaPaymentByBookingId(
      String bookingId) async {
    var results = await connection.query(
      'SELECT * FROM esewa_payments WHERE booking_id = ?',
      [bookingId],
    );
    if (results.isEmpty) return null;
    final row = results.first;
    return _rowToMap(row);
  }

  Future<Map<String, dynamic>?> getEsewaPaymentByOrderId(int orderId) async {
    var results = await connection.query(
      'SELECT * FROM esewa_payments WHERE order_id = ? ORDER BY created_at DESC LIMIT 1',
      [orderId],
    );
    if (results.isEmpty) return null;
    return _rowToMap(results.first);
  }

  Future<Map<String, dynamic>?> getEsewaPaymentByCorrelationId(
      String correlationId) async {
    var results = await connection.query(
      'SELECT * FROM esewa_payments WHERE correlation_id = ?',
      [correlationId],
    );
    if (results.isEmpty) return null;
    return _rowToMap(results.first);
  }

  Map<String, dynamic> _rowToMap(dynamic row) {
    return {
      'id': row['id'],
      'order_id': row['order_id'],
      'booking_id': row['booking_id'],
      'correlation_id': row['correlation_id'],
      'transaction_uuid': row['transaction_uuid'],
      'amount': row['amount'],
      'status': row['status'],
      'cart_type': row['cart_type'],
      'cart_user_id': row['cart_user_id'],
      'cart_product_ids': row['cart_product_ids'],
    };
  }

  Future<void> saveCartInfo(
    String bookingId,
    String cartType,
    int userId,
    String? selectedProductIds,
  ) async {
    await connection.query(
      '''UPDATE esewa_payments
         SET cart_type = ?, cart_user_id = ?, cart_product_ids = ?
         WHERE booking_id = ?''',
      [cartType, userId, selectedProductIds, bookingId],
    );
  }

  Future<void> updatePaymentStatus(String bookingId, String status) async {
    await connection.query(
      'UPDATE esewa_payments SET status = ? WHERE booking_id = ?',
      [status, bookingId],
    );
  }

  Future<void> updateOrderStatus(int orderId, String status) async {
    await connection.query(
      'UPDATE orders SET order_status = ? WHERE order_id = ?',
      [status, orderId],
    );
  }

  Future<void> clearCartIfNeeded(String bookingId) async {
    final payment = await getEsewaPaymentByBookingId(bookingId);
    if (payment == null) return;

    final cartType = payment['cart_type'] as String?;
    final userId = payment['cart_user_id'] as int?;
    if (cartType == null || userId == null) return;

    if (cartType == 'cart_all') {
      await connection.query('DELETE FROM cart WHERE user_id = ?', [userId]);
    } else if (cartType == 'cart_selected') {
      final idsJson = payment['cart_product_ids'] as String?;
      if (idsJson != null) {
        final ids = List<int>.from(jsonDecode(idsJson));
        for (final id in ids) {
          await connection
              .query('DELETE FROM cart WHERE user_id = ? AND product_id = ?', [userId, id]);
        }
      }
    }
  }

  bool verifyCallbackSignature(Map<String, dynamic> data) {
    try {
      final signedFieldNames =
          (data['signed_field_names'] as String).split(',');
      final message =
          signedFieldNames.map((f) => '$f=${data[f]}').join(',');
      final expectedSignature = _generateSignature(message);
      return data['signature'] == expectedSignature;
    } catch (_) {
      return false;
    }
  }
}
