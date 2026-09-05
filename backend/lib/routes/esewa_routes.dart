import 'dart:convert';
import 'dart:io';
import 'package:shelf/shelf.dart';
import 'package:shelf_router/shelf_router.dart';
import '../services/esewa_service.dart';
import '../services/order_service.dart';
import '../models/order_model.dart';

class EsewaRoutes {
  final EsewaService esewaService;
  final OrderService orderService;

  EsewaRoutes(this.esewaService, this.orderService);

  // Backend's own public URL — eSewa redirects the browser here after payment
  static String get _backendUrl =>
      Platform.environment['BACKEND_URL'] ??
      'https://dart-backend-production-359e.up.railway.app';

  // Frontend URL — backend redirects browser here after verifying payment
  static String get _frontendUrl =>
      Platform.environment['FRONTEND_URL'] ?? 'https://nepstyleweb.vercel.app';

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

        // eSewa redirects browser to these after payment (both success + failure
        // hit the same verify handler — we never trust eSewa's choice, only the
        // status API response)
        final verifyUrl = '$_backendUrl/api/esewa/verify?order_id=$orderId';

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

        // Store cart metadata for cleanup after successful payment
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

    // GET /api/esewa/verify?order_id=X
    // eSewa redirects the browser here (both success and failure).
    // We verify with eSewa's status API, then redirect the browser to frontend.
    r.get('/verify', (Request request) async {
      final orderIdStr = request.url.queryParameters['order_id'];
      final orderId = int.tryParse(orderIdStr ?? '');

      if (orderId == null) {
        return Response.found('$_frontendUrl/esewa-return?payment=failed&reason=invalid_order');
      }

      try {
        final result = await esewaService.verifyPayment(orderId);

        if (result['success'] == true) {
          await esewaService.clearCartIfNeeded(orderId);
          return Response.found(
            '$_frontendUrl/esewa-return?order_id=$orderId&payment=success',
          );
        } else {
          final status = (result['status'] as String? ?? 'failed').toLowerCase();
          return Response.found(
            '$_frontendUrl/esewa-return?order_id=$orderId&payment=failed&reason=$status',
          );
        }
      } catch (e) {
        print('eSewa /verify error: $e');
        return Response.found(
          '$_frontendUrl/esewa-return?order_id=$orderId&payment=failed&reason=error',
        );
      }
    });

    return r;
  }
}
