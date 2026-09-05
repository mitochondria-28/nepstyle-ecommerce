import 'dart:convert';
import 'dart:io';
import 'package:crypto/crypto.dart';
import 'package:shelf/shelf.dart';
import 'package:shelf_router/shelf_router.dart';
import '../services/esewa_service.dart';
import '../services/order_service.dart';
import '../models/order_model.dart';

class EsewaRoutes {
  final EsewaService esewaService;
  final OrderService orderService;

  EsewaRoutes(this.esewaService, this.orderService);

  static String get _backendUrl =>
      Platform.environment['BACKEND_URL'] ??
      'https://dart-backend-production-359e.up.railway.app';

  static String get _frontendUrl =>
      Platform.environment['FRONTEND_URL'] ?? 'https://nepstyleweb.vercel.app';

  static const String _secretKey = '8gBm/:&EnhH.1/q';

  // Verify the HMAC-SHA256 signature eSewa includes in the data payload.
  bool _verifyDataSignature(Map<String, dynamic> decoded) {
    try {
      final signedFieldNames =
          (decoded['signed_field_names'] as String).split(',');
      final message =
          signedFieldNames.map((f) => '$f=${decoded[f]}').join(',');
      final expected = base64.encode(
        Hmac(sha256, utf8.encode(_secretKey)).convert(utf8.encode(message)).bytes,
      );
      return decoded['signature'] == expected;
    } catch (_) {
      return false;
    }
  }

  Router get router {
    final r = Router();

    // POST /api/esewa/initiate — create order + get eSewa payment URL
    r.post('/initiate', (Request request) async {
      try {
        final payload = await request.readAsString();
        final data = jsonDecode(payload) as Map<String, dynamic>;

        final cartType = data['cart_type'] as String? ?? 'direct';
        final items = List<Map<String, dynamic>>.from(data['items'] ?? []);

        if (items.isEmpty) {
          return Response.badRequest(
            body: jsonEncode({'status': false, 'message': 'No items provided'}),
            headers: {'Content-Type': 'application/json'},
          );
        }

        final order = Order(
          userId: data['user_id'] as int?,
          guestName: data['guest_name'] as String?,
          guestPhone: data['guest_phone'] as String?,
          totalAmount: (data['total_amount'] as num).toDouble(),
          paymentMethod: 'eSewa',
          deliveryLocation: data['delivery_location'] as String,
          orderStatus: 'pending',
        );

        final orderItems = items
            .map((item) => OrderItem(
                  orderId: 0,
                  productId: item['product_id'] as int,
                  quantity: item['quantity'] as int,
                  price: (item['price'] as num).toDouble(),
                ))
            .toList();

        final orderId =
            await orderService.placeOrderAndReturnId(order, orderItems);
        if (orderId == null) {
          return Response.internalServerError(
            body: jsonEncode(
                {'status': false, 'message': 'Failed to create order'}),
            headers: {'Content-Type': 'application/json'},
          );
        }

        // Use path param (/verify/<orderId>) so eSewa can safely append ?data=...
        // without breaking the URL (eSewa always appends ?data=base64 to the URL).
        final verifyUrl = '$_backendUrl/api/esewa/verify/$orderId';

        final esewaResult = await esewaService.initiatePayment(
          amount: order.totalAmount,
          orderId: orderId,
          successUrl: verifyUrl,
          failureUrl: verifyUrl,
        );

        if (!(esewaResult['success'] as bool)) {
          await esewaService.updateOrderStatus(orderId, 'cancelled');
          return Response.badRequest(
            body: jsonEncode({
              'status': false,
              'message': esewaResult['error'] ?? 'eSewa initiation failed',
            }),
            headers: {'Content-Type': 'application/json'},
          );
        }

        if (data['user_id'] != null && cartType != 'direct') {
          final selectedIds = data['selected_product_ids'] != null
              ? jsonEncode(data['selected_product_ids'])
              : null;
          await esewaService.saveCartInfo(
            orderId,
            cartType,
            data['user_id'] as int,
            selectedIds,
          );
        }

        return Response.ok(
          jsonEncode({
            'status': true,
            'payment_url': esewaResult['payment_url'],
            'transaction_uuid': esewaResult['transaction_uuid'],
            'order_id': orderId,
          }),
          headers: {'Content-Type': 'application/json'},
        );
      } catch (e) {
        print('eSewa /initiate error: $e');
        return Response.internalServerError(
          body: jsonEncode(
              {'status': false, 'message': 'Internal server error'}),
          headers: {'Content-Type': 'application/json'},
        );
      }
    });

    // GET /api/esewa/verify/<orderId>?data=<base64>
    // eSewa redirects the browser here after payment (success AND failure).
    // The ?data= param contains a base64-encoded JSON with status + signature.
    r.get('/verify/<orderId>', (Request request, String orderId) async {
      final parsedOrderId = int.tryParse(orderId);
      if (parsedOrderId == null) {
        return Response.found(
            '$_frontendUrl/esewa-return?payment=failed&reason=invalid_order');
      }

      final dataParam = request.url.queryParameters['data'];

      // No data param means eSewa hit the failure URL without any payload
      if (dataParam == null || dataParam.isEmpty) {
        await esewaService.updateOrderStatus(parsedOrderId, 'cancelled');
        return Response.found(
            '$_frontendUrl/esewa-return?order_id=$parsedOrderId&payment=failed&reason=canceled');
      }

      try {
        final decoded =
            jsonDecode(utf8.decode(base64.decode(dataParam))) as Map<String, dynamic>;

        print('eSewa callback data for order $parsedOrderId: $decoded');

        // Verify HMAC signature to ensure payload is genuine
        if (!_verifyDataSignature(decoded)) {
          print('eSewa signature mismatch for order $parsedOrderId');
          return Response.found(
              '$_frontendUrl/esewa-return?order_id=$parsedOrderId&payment=failed&reason=invalid_signature');
        }

        final status = decoded['status'] as String? ?? '';

        if (status == 'COMPLETE') {
          await esewaService.updatePaymentStatus(
              decoded['transaction_uuid'] as String, 'COMPLETE');
          await esewaService.updateOrderStatus(parsedOrderId, 'pending');
          await esewaService.clearCartIfNeeded(parsedOrderId);
          return Response.found(
              '$_frontendUrl/esewa-return?order_id=$parsedOrderId&payment=success');
        } else {
          final reason = status.toLowerCase().replaceAll(' ', '_');
          await esewaService.updateOrderStatus(parsedOrderId, 'cancelled');
          return Response.found(
              '$_frontendUrl/esewa-return?order_id=$parsedOrderId&payment=failed&reason=$reason');
        }
      } catch (e) {
        print('eSewa /verify/$orderId error: $e');
        return Response.found(
            '$_frontendUrl/esewa-return?order_id=$parsedOrderId&payment=failed&reason=error');
      }
    });

    return r;
  }
}
