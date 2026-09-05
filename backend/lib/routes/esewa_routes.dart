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

  // Backend base URL for callback (eSewa server → our backend)
  static String get _callbackUrl =>
      Platform.environment['ESEWA_CALLBACK_URL'] ??
      'http://localhost:8080/api/esewa/callback';

  // Frontend base URL for redirect (eSewa browser → our web app)
  static String get _frontendBaseUrl =>
      Platform.environment['FRONTEND_URL'] ?? 'http://localhost:3000';

  Router get router {
    final r = Router();

    // POST /api/esewa/initiate — create order + book eSewa payment
    r.post('/initiate', (Request request) async {
      try {
        final payload = await request.readAsString();
        final data = jsonDecode(payload) as Map<String, dynamic>;

        final cartType = data['cart_type'] as String? ?? 'direct';
        final items = List<Map<String, dynamic>>.from(data['items'] ?? []);

        if (items.isEmpty) {
          return Response.badRequest(
            body: jsonEncode({'status': false, 'message': 'No items provided'}),
          );
        }

        final order = Order(
          userId: data['user_id'] as int?,
          guestName: data['guest_name'] as String?,
          guestPhone: data['guest_phone'] as String?,
          totalAmount: (data['total_amount'] as num).toDouble(),
          paymentMethod: 'eSewa',
          deliveryLocation: data['delivery_location'] as String,
          orderStatus: 'pending_payment',
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
          );
        }

        final redirectUrl =
            '$_frontendBaseUrl/esewa-return?order_id=$orderId';

        final properties = <String, dynamic>{
          'customer_id': data['user_id']?.toString() ?? 'guest',
          'remarks': 'NepStyle Order #$orderId',
        };

        final esewaResult = await esewaService.initiatePayment(
          amount: order.totalAmount,
          orderId: orderId,
          callbackUrl: _callbackUrl,
          redirectUrl: redirectUrl,
          properties: properties,
        );

        if (!(esewaResult['success'] as bool)) {
          await esewaService.updateOrderStatus(orderId, 'cancelled');
          return Response.badRequest(
            body: jsonEncode({
              'status': false,
              'message': esewaResult['error'],
            }),
          );
        }

        final bookingId = esewaResult['booking_id'] as String;

        // Store cart metadata so we can clear cart after successful payment
        if (data['user_id'] != null && cartType != 'direct') {
          final selectedIds = data['selected_product_ids'] != null
              ? jsonEncode(data['selected_product_ids'])
              : null;
          await esewaService.saveCartInfo(
            bookingId,
            cartType,
            data['user_id'] as int,
            selectedIds,
          );
        }

        return Response.ok(
          jsonEncode({
            'status': true,
            'booking_id': bookingId,
            'correlation_id': esewaResult['correlation_id'],
            'deeplink': esewaResult['deeplink'],
            'order_id': orderId,
          }),
          headers: {'Content-Type': 'application/json'},
        );
      } catch (e) {
        print('eSewa /initiate error: $e');
        return Response.internalServerError(
          body:
              jsonEncode({'status': false, 'message': 'Internal server error'}),
        );
      }
    });

    // POST /api/esewa/verify — frontend calls this after redirect to confirm payment
    r.post('/verify', (Request request) async {
      try {
        final payload = await request.readAsString();
        final data = jsonDecode(payload) as Map<String, dynamic>;

        final orderId = data['order_id'] as int;

        // Lookup esewa payment by order_id
        final esewaPayment =
            await esewaService.getEsewaPaymentByOrderId(orderId);
        if (esewaPayment == null) {
          return Response.notFound(
            jsonEncode({'status': false, 'message': 'Payment record not found'}),
          );
        }

        final bookingId = esewaPayment['booking_id'] as String;
        final correlationId = esewaPayment['correlation_id'] as String;

        final statusResult =
            await esewaService.checkStatus(bookingId, correlationId);

        if (statusResult['code'] == 'IP-201') {
          final status = statusResult['data']['status'] as String;

          await esewaService.updatePaymentStatus(bookingId, status);

          if (status == 'SUCCESS') {
            await esewaService.updateOrderStatus(orderId, 'pending');
            await esewaService.clearCartIfNeeded(bookingId);
            return Response.ok(jsonEncode({
              'status': true,
              'payment_status': 'SUCCESS',
              'order_id': orderId,
              'message': 'Payment verified',
            }));
          } else {
            await esewaService.updateOrderStatus(orderId, status.toLowerCase());
            return Response.ok(jsonEncode({
              'status': false,
              'payment_status': status,
              'order_id': orderId,
              'message': 'Payment $status',
            }));
          }
        } else {
          return Response.ok(jsonEncode({
            'status': false,
            'payment_status': 'UNKNOWN',
            'order_id': orderId,
            'message': 'Could not verify payment status',
          }));
        }
      } catch (e) {
        print('eSewa /verify error: $e');
        return Response.internalServerError(
          body:
              jsonEncode({'status': false, 'message': 'Internal server error'}),
        );
      }
    });

    // POST /api/esewa/callback — webhook called by eSewa server after payment
    r.post('/callback', (Request request) async {
      try {
        final payload = await request.readAsString();
        final data = jsonDecode(payload) as Map<String, dynamic>;

        if (!esewaService.verifyCallbackSignature(data)) {
          return Response.forbidden(
            jsonEncode({'error': 'Invalid signature'}),
          );
        }

        final correlationId = data['correlation_id'] as String;
        final status = data['status'] as String;

        final esewaPayment =
            await esewaService.getEsewaPaymentByCorrelationId(correlationId);
        if (esewaPayment == null) {
          return Response.notFound(
            jsonEncode({'error': 'Payment not found'}),
          );
        }

        final orderId = esewaPayment['order_id'] as int;
        final bookingId = esewaPayment['booking_id'] as String;

        await esewaService.updatePaymentStatus(bookingId, status);

        if (status == 'SUCCESS') {
          await esewaService.updateOrderStatus(orderId, 'pending');
          await esewaService.clearCartIfNeeded(bookingId);
        } else {
          await esewaService.updateOrderStatus(orderId, status.toLowerCase());
        }

        return Response.ok(jsonEncode({'message': 'Callback processed'}));
      } catch (e) {
        print('eSewa /callback error: $e');
        return Response.internalServerError();
      }
    });

    // POST /api/esewa/cancel — cancel a pending booking
    r.post('/cancel', (Request request) async {
      try {
        final payload = await request.readAsString();
        final data = jsonDecode(payload) as Map<String, dynamic>;

        final bookingId = data['booking_id'] as String;
        final orderId = data['order_id'] as int;

        final result = await esewaService.cancelPayment(bookingId);

        if (result['code'] == 'IP-210') {
          await esewaService.updatePaymentStatus(bookingId, 'CANCELED');
          await esewaService.updateOrderStatus(orderId, 'cancelled');
          return Response.ok(jsonEncode({'status': true, 'message': 'Payment cancelled'}));
        } else {
          return Response.ok(jsonEncode({
            'status': false,
            'message': result['error_message'] ?? 'Cancel failed',
          }));
        }
      } catch (e) {
        print('eSewa /cancel error: $e');
        return Response.internalServerError();
      }
    });

    return r;
  }
}
