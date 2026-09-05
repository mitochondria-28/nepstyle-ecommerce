import 'dart:convert';
import 'dart:io';
import 'dart:math';
import 'package:crypto/crypto.dart';
import '../database/db.dart';

class EsewaService {
  final ManagedConnection connection;

  // eSewa ePay v2 sandbox credentials (publicly documented test values)
  static const String _productCode = 'EPAYTEST';
  static const String _secretKey = '8gBm/:&EnhH.1/q';
  static const String _initiateUrl =
      'https://rc-epay.esewa.com.np/api/epay/main/v2/form';
  static const String _verifyUrl =
      'https://rc.esewa.com.np/api/epay/transaction/status/';

  EsewaService(this.connection) {
    _ensureTable();
  }

  Future<void> _ensureTable() async {
    await connection.query('''
      CREATE TABLE IF NOT EXISTS esewa_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        transaction_uuid VARCHAR(255) UNIQUE,
        amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'INITIATED',
        cart_type VARCHAR(50),
        cart_user_id INT,
        cart_product_ids TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    ''');
  }

  String _generateSignature(String message) {
    final keyBytes = utf8.encode(_secretKey);
    final messageBytes = utf8.encode(message);
    final hmac = Hmac(sha256, keyBytes);
    final digest = hmac.convert(messageBytes);
    return base64.encode(digest.bytes);
  }

  String _generateTransactionUuid() {
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final random = Random().nextInt(99999);
    return 'txn-$timestamp-$random';
  }

  /// POST form data to eSewa ePay v2, follow the redirect manually,
  /// and return the payment URL from the Location header.
  Future<Map<String, dynamic>> initiatePayment({
    required double amount,
    required int orderId,
    required String successUrl,
    required String failureUrl,
  }) async {
    final transactionUuid = _generateTransactionUuid();
    final totalAmount = amount.toStringAsFixed(2);

    final message =
        'total_amount=$totalAmount,transaction_uuid=$transactionUuid,product_code=$_productCode';
    final signature = _generateSignature(message);

    final formFields = {
      'amount': totalAmount,
      'tax_amount': '0',
      'total_amount': totalAmount,
      'transaction_uuid': transactionUuid,
      'product_code': _productCode,
      'product_service_charge': '0',
      'product_delivery_charge': '0',
      'success_url': successUrl,
      'failure_url': failureUrl,
      'signed_field_names': 'total_amount,transaction_uuid,product_code',
      'signature': signature,
    };

    final body = formFields.entries
        .map((e) =>
            '${Uri.encodeQueryComponent(e.key)}=${Uri.encodeQueryComponent(e.value)}')
        .join('&');

    String? paymentUrl;
    try {
      final httpClient = HttpClient();
      final request = await httpClient.postUrl(Uri.parse(_initiateUrl));
      request.followRedirects = false;
      request.headers.set(
          HttpHeaders.contentTypeHeader, 'application/x-www-form-urlencoded');
      request.write(body);

      final response = await request.close();
      await response.drain();

      if (response.statusCode == 302 || response.statusCode == 301) {
        paymentUrl = response.headers.value(HttpHeaders.locationHeader);
      }
      httpClient.close();
    } catch (e) {
      print('eSewa ePay initiate error: $e');
      return {'success': false, 'error': 'Could not reach eSewa service'};
    }

    if (paymentUrl == null) {
      return {
        'success': false,
        'error': 'eSewa did not return a payment URL'
      };
    }

    // Save to esewa_payments
    await connection.query(
      '''INSERT INTO esewa_payments
         (order_id, transaction_uuid, amount, status)
         VALUES (?, ?, ?, 'INITIATED')''',
      [orderId, transactionUuid, amount],
    );

    return {
      'success': true,
      'payment_url': paymentUrl,
      'transaction_uuid': transactionUuid,
    };
  }

  /// Verify payment status with eSewa's authoritative status API.
  Future<Map<String, dynamic>> verifyPayment(int orderId) async {
    final record = await getEsewaPaymentByOrderId(orderId);
    if (record == null) {
      return {'success': false, 'message': 'No payment record found'};
    }

    final transactionUuid = record['transaction_uuid'] as String;
    final amount = record['amount'];
    final totalAmount = (amount is double ? amount : (amount as num).toDouble())
        .toStringAsFixed(2);

    final uri = Uri.parse(_verifyUrl).replace(queryParameters: {
      'product_code': _productCode,
      'total_amount': totalAmount,
      'transaction_uuid': transactionUuid,
    });

    try {
      final httpClient = HttpClient();
      final request = await httpClient.getUrl(uri);
      request.headers.set(HttpHeaders.acceptHeader, 'application/json');
      final response = await request.close();
      final body = await response.transform(utf8.decoder).join();
      httpClient.close();

      final data = jsonDecode(body) as Map<String, dynamic>;
      final status = data['status'] as String? ?? 'UNKNOWN';

      print('eSewa verify response for order $orderId: $data');

      if (status == 'COMPLETE') {
        final amountMatches =
            (data['total_amount'] as num? ?? 0).toDouble() - amount.toDouble() <
                0.01;
        final uuidMatches = data['transaction_uuid'] == transactionUuid;

        if (amountMatches && uuidMatches) {
          await updatePaymentStatus(transactionUuid, 'COMPLETE');
          await updateOrderStatus(orderId, 'pending');
          return {'success': true, 'status': 'COMPLETE'};
        }
        return {
          'success': false,
          'status': 'MISMATCH',
          'message': 'Amount or transaction ID mismatch'
        };
      }

      if (status == 'PENDING' || status == 'AMBIGUOUS') {
        return {
          'success': false,
          'status': status,
          'message': 'Payment still processing'
        };
      }

      // CANCELED, NOT_FOUND, or anything else
      await updatePaymentStatus(transactionUuid, status);
      await updateOrderStatus(orderId, 'cancelled');
      return {
        'success': false,
        'status': status,
        'message': 'Payment not completed'
      };
    } catch (e) {
      print('eSewa verify error: $e');
      return {'success': false, 'message': 'Could not verify with eSewa'};
    }
  }

  Future<Map<String, dynamic>?> getEsewaPaymentByOrderId(int orderId) async {
    var results = await connection.query(
      'SELECT * FROM esewa_payments WHERE order_id = ? ORDER BY created_at DESC LIMIT 1',
      [orderId],
    );
    if (results.isEmpty) return null;
    final row = results.first;
    return {
      'id': row['id'],
      'order_id': row['order_id'],
      'transaction_uuid': row['transaction_uuid'],
      'amount': row['amount'],
      'status': row['status'],
      'cart_type': row['cart_type'],
      'cart_user_id': row['cart_user_id'],
      'cart_product_ids': row['cart_product_ids'],
    };
  }

  Future<void> saveCartInfo(
    int orderId,
    String cartType,
    int userId,
    String? selectedProductIds,
  ) async {
    await connection.query(
      '''UPDATE esewa_payments
         SET cart_type = ?, cart_user_id = ?, cart_product_ids = ?
         WHERE order_id = ?''',
      [cartType, userId, selectedProductIds, orderId],
    );
  }

  Future<void> updatePaymentStatus(
      String transactionUuid, String status) async {
    await connection.query(
      'UPDATE esewa_payments SET status = ? WHERE transaction_uuid = ?',
      [status, transactionUuid],
    );
  }

  Future<void> updateOrderStatus(int orderId, String status) async {
    await connection.query(
      'UPDATE orders SET order_status = ? WHERE order_id = ?',
      [status, orderId],
    );
  }

  Future<void> clearCartIfNeeded(int orderId) async {
    final payment = await getEsewaPaymentByOrderId(orderId);
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
          await connection.query(
              'DELETE FROM cart WHERE user_id = ? AND product_id = ?',
              [userId, id]);
        }
      }
    }
  }
}
