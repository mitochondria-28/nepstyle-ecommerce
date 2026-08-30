import 'dart:convert';
import 'package:shelf/shelf.dart';
import 'package:shelf_router/shelf_router.dart';
import '../services/order_service.dart';
import '../models/order_model.dart';

class OrderRoutes {
  final OrderService orderService;

  OrderRoutes(this.orderService);

  Router get router {
    final router = Router();

    router.post('/place', (Request request) async {
      try {
        final payload = await request.readAsString();
        final data = jsonDecode(payload);

        final order = Order(
          userId: data['user_id'],
          totalAmount: (data['total_amount'] ?? 0).toDouble(),
          paymentMethod: data['payment_method'],
          deliveryLocation: data['delivery_location'],
        );

        final items = List<Map<String, dynamic>>.from(data['items']);

        final orderItems = items
            .map((item) => OrderItem(
                  orderId: 0,
                  productId: item['product_id'],
                  quantity: item['quantity'],
                  price: item['price'],
                ))
            .toList();

        final success = await orderService.placeSingleOrder(order, orderItems);

        return success == 1
            ? Response.ok(
                jsonEncode({'status': true, 'message': 'Order placed'}))
            : Response.internalServerError();
      } catch (e) {
        return Response.internalServerError();
      }
    });
    router.get('/all', (Request request) async {
      try {
        final orders = await orderService.getAllOrders();
        return Response.ok(jsonEncode({'status': true, 'orders': orders}));
      } catch (e) {
        return Response.internalServerError(
            body: jsonEncode(
                {'status': false, 'message': 'Error fetching orders'}));
      }
    });

    router.get('/user/<userId>', (Request request, String userId) async {
      try {
        final orders = await orderService.getUserOrders(int.parse(userId));
        return Response.ok(jsonEncode({'status': true, 'orders': orders}));
      } catch (e) {
        return Response.internalServerError(
            body: jsonEncode(
                {'status': false, 'message': 'Error fetching user orders'}));
      }
    });

    router.post('/from-cart', (Request request) async {
      try {
        final payload = await request.readAsString();
        final data = jsonDecode(payload);

        final int userId = data['user_id'];
        final List<int> selectedProductIds =
            List<int>.from(data['product_ids']);
        final String paymentMethod = data['payment_method'];
        final String deliveryLocation = data['delivery_location'];

        final success = await orderService.placeSelectedCartOrder(
            userId, selectedProductIds, paymentMethod, deliveryLocation);

        return success == 1
            ? Response.ok(jsonEncode(
                {'status': true, 'message': 'Selected cart order placed'}))
            : Response.internalServerError();
      } catch (e) {
        return Response.internalServerError(
            body: jsonEncode({
          'status': false,
          'message': 'Error placing selected cart order'
        }));
      }
    });

    router.post('/from-cart/all', (Request request) async {
      try {
        final payload = await request.readAsString();
        final data = jsonDecode(payload);

        final int userId = data['user_id'];
        final String paymentMethod = data['payment_method'];
        final String deliveryLocation = data['delivery_location'];

        final success = await orderService.placeCartOrder(
            userId, paymentMethod, deliveryLocation);

        return success == 1
            ? Response.ok(jsonEncode(
                {'status': true, 'message': 'All cart items ordered'}))
            : Response.internalServerError();
      } catch (e) {
        return Response.internalServerError(
            body: jsonEncode(
                {'status': false, 'message': 'Error placing full cart order'}));
      }
    });

    return router;
  }
}
