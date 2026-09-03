import 'dart:developer';
import 'package:esewa_flutter_sdk/esewa_config.dart';
import 'package:esewa_flutter_sdk/esewa_flutter_sdk.dart';
import 'package:esewa_flutter_sdk/esewa_payment.dart';
import 'package:esewa_flutter_sdk/esewa_payment_success_result.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter/cupertino.dart';
import 'package:get/route_manager.dart';
import 'package:nepstyle/core/constants/colors.dart';
import 'package:nepstyle/features/home/presentation/screens/homepage.dart' show HomeScreen;
import 'package:nepstyle/features/user%20profile/presentation/screens/order_list.dart';
import '../../../../core/constants/user_data.dart';
import '../../../cart/data/models/order_cart_model.dart';
import '../../data/models/home_model.dart';
import '../blocs/order_bloc/order_bloc.dart';
import 'map_location_picker.dart';
import 'package:http/http.dart' as http;

class PaymentConfirmationScreen extends StatefulWidget {
  final Product product;
  final int quantity;
  final double totalAmount;

  const PaymentConfirmationScreen({
    super.key,
    required this.product,
    required this.quantity,
    required this.totalAmount,
  });

  @override
  PaymentConfirmationScreenState createState() =>
      PaymentConfirmationScreenState();
}

class PaymentConfirmationScreenState
    extends State<PaymentConfirmationScreen> {
  String? selectedPaymentMethod;
  String? selectedLocation;

  // Guest info controllers (only used when userId == null)
  final TextEditingController _guestNameController = TextEditingController();
  final TextEditingController _guestPhoneController = TextEditingController();

  bool get _isGuest => userId == null;

  final List<Map<String, String>> paymentMethods = [
    {"name": "eSewa", "image": "assets/images/esewa.png"},
    {"name": "Khalti", "image": "assets/images/khalti.png"},
    {"name": "Cash on Delivery", "image": "assets/images/cod.png"},
  ];

  @override
  void dispose() {
    _guestNameController.dispose();
    _guestPhoneController.dispose();
    super.dispose();
  }

  void _selectLocation() async {
    const List<String> locations = [
      "Kathmandu", "Pokhara", "Lalitpur", "Bhaktapur",
      "Chitwan", "Biratnagar", "Butwal",
    ];

    final location = await showModalBottomSheet<String>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40, height: 4,
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text("Select City",
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ),
            ...locations.map((loc) => ListTile(
                  leading: const Icon(Icons.location_on_outlined),
                  title: Text(loc),
                  onTap: () => Navigator.pop(context, loc),
                )),
          ],
        ),
      ),
    );

    if (location != null) setState(() => selectedLocation = location);
  }

  bool _validateGuest() {
    if (_isGuest) {
      if (_guestNameController.text.trim().isEmpty) {
        _showSnack('Please enter your full name');
        return false;
      }
      final phone = _guestPhoneController.text.trim();
      if (phone.isEmpty || !RegExp(r'^\d{7,15}$').hasMatch(phone)) {
        _showSnack('Please enter a valid contact number');
        return false;
      }
    }
    return true;
  }

  void _showSnack(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: Colors.red),
    );
  }

  void _confirmPurchase() {
    if (selectedPaymentMethod == null) {
      _showSnack('Please select a payment method');
      return;
    }
    if (selectedLocation == null) {
      _showSnack('Please select a delivery location');
      return;
    }
    if (!_validateGuest()) return;

    final order = Order(
      userId: _isGuest ? null : userId as int,
      guestName: _isGuest ? _guestNameController.text.trim() : null,
      guestPhone: _isGuest ? _guestPhoneController.text.trim() : null,
      totalAmount: widget.product.sellPrice * widget.quantity,
      paymentMethod: selectedPaymentMethod!,
      deliveryLocation: selectedLocation!,
      items: [
        OrderItem(
          productId: widget.product.productId,
          quantity: widget.quantity,
          price: widget.product.sellPrice,
        ),
      ],
    );

    if (selectedPaymentMethod == "eSewa") {
      payEsewa(order);
    } else {
      context.read<OrderBloc>().add(PlaceSingleOrder(order));
    }
  }

  void payEsewa(Order order) {
    try {
      EsewaFlutterSdk.initPayment(
        esewaConfig: EsewaConfig(
          environment: Environment.test,
          clientId: 'JB0BBQ4aD0UqIThFJwAKBgAXEUkEGQUBBAwdOgABHD4DChwUAB0R',
          secretId: 'BhwIWQQADhIYSxILExMcAgFXFhcOBwAKBgAXEQ==',
        ),
        esewaPayment: EsewaPayment(
          productId: widget.product.productId.toString(),
          productName: widget.product.productName,
          productPrice: widget.product.sellPrice.toString(),
          callbackUrl: '',
        ),
        onPaymentSuccess: (EsewaPaymentSuccessResult data) async {
          debugPrint(":::SUCCESS::: => $data");
          verifyTransactionStatus(data, order);
        },
        onPaymentFailure: (data) {
          debugPrint(":::FAILURE::: => $data");
        },
        onPaymentCancellation: (data) {
          debugPrint(":::CANCELLATION::: => $data");
        },
      );
    } on Exception catch (e) {
      debugPrint("EXCEPTION : ${e.toString()}");
    }
  }

  void verifyTransactionStatus(EsewaPaymentSuccessResult result, Order order) async {
    final data = result.toJson();
    final response = await callVerificationApi(data['refId']);
    if (!mounted) return;
    if (response.statusCode == 200) {
      context.read<OrderBloc>().add(PlaceSingleOrder(order));
    } else {
      showDialog(
        context: context,
        builder: (_) => const AlertDialog(content: Text('Verification Failed')),
      );
    }
  }

  Future<http.Response> callVerificationApi(String refId) async {
    return http.get(
      Uri.parse("https://esewa.com.np/mobile/transaction?txnRefId=$refId"),
      headers: {
        'Content-Type': 'application/json',
        'merchantSecret': 'BhwIWQQADhIYSxILExMcAgFXFhcOBwAKBgAXEQ==',
        'merchantId': 'JB0BBQ4aD0UqIThFJwAKBgAXEUkEGQUBBAwdOgABHD4DChwUAB0R',
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Confirm Order",
            style: TextStyle(color: Colors.black)),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: BlocConsumer<OrderBloc, OrderState>(
        listener: (context, state) {
          if (state is OrderSuccess) {
            _showSuccessDialog();
          } else if (state is OrderFailure) {
            _showErrorDialog("Error occurred while purchasing");
          }
        },
        builder: (context, state) {
          return Stack(
            children: [
              SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [

                    // ── Guest info (shown only when not logged in) ──────────
                    if (_isGuest) ...[
                      const Text("Your Information",
                          style: TextStyle(
                              fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Text(
                        "No account? No problem — fill in your details below.",
                        style: TextStyle(
                            fontSize: 13, color: Colors.grey.shade600),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _guestNameController,
                        textCapitalization: TextCapitalization.words,
                        decoration: InputDecoration(
                          labelText: "Full Name",
                          prefixIcon: const Icon(Icons.person_outline),
                          border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _guestPhoneController,
                        keyboardType: TextInputType.phone,
                        decoration: InputDecoration(
                          labelText: "Contact Number",
                          prefixIcon: const Icon(Icons.phone_outlined),
                          hintText: "e.g. 9800000000",
                          border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],

                    // ── Delivery location ───────────────────────────────────
                    const Text("Select Location",
                        style: TextStyle(
                            fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 10),
                    InkWell(
                      onTap: _selectLocation,
                      borderRadius: BorderRadius.circular(10),
                      child: Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          border: Border.all(
                            color: selectedLocation != null
                                ? primaryColor2
                                : Colors.grey.shade400,
                            width: selectedLocation != null ? 2 : 1,
                          ),
                          borderRadius: BorderRadius.circular(10),
                          color: selectedLocation != null
                              ? primaryColor2.withValues(alpha: 0.05)
                              : Colors.white,
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              selectedLocation ?? "Choose your delivery city",
                              style: TextStyle(
                                  fontSize: 15,
                                  color: selectedLocation != null
                                      ? Colors.black
                                      : Colors.grey),
                            ),
                            Icon(Icons.location_on,
                                color: selectedLocation != null
                                    ? primaryColor2
                                    : Colors.grey),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // ── Payment methods ─────────────────────────────────────
                    const Text("Select Payment Method",
                        style: TextStyle(
                            fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 10),
                    ...paymentMethods.map((method) => GestureDetector(
                          onTap: () => setState(
                              () => selectedPaymentMethod = method["name"]),
                          child: Container(
                            margin: const EdgeInsets.symmetric(vertical: 5),
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              border: Border.all(
                                color: selectedPaymentMethod == method["name"]
                                    ? primaryColor2
                                    : Colors.grey.shade300,
                                width: selectedPaymentMethod == method["name"]
                                    ? 2
                                    : 1,
                              ),
                              borderRadius: BorderRadius.circular(10),
                              color: selectedPaymentMethod == method["name"]
                                  ? primaryColor2.withValues(alpha: 0.08)
                                  : Colors.white,
                            ),
                            child: Row(
                              children: [
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(6),
                                  child: Image.asset(method["image"]!,
                                      width: 44, height: 44,
                                      fit: BoxFit.contain),
                                ),
                                const SizedBox(width: 14),
                                Text(method["name"]!,
                                    style: const TextStyle(
                                        fontSize: 15,
                                        fontWeight: FontWeight.w600)),
                                const Spacer(),
                                if (selectedPaymentMethod == method["name"])
                                  Icon(Icons.check_circle,
                                      color: primaryColor2),
                              ],
                            ),
                          ),
                        )),
                    const SizedBox(height: 24),

                    // ── Order summary ───────────────────────────────────────
                    const Text("Order Details",
                        style: TextStyle(
                            fontSize: 18, fontWeight: FontWeight.bold)),
                    Divider(color: Colors.grey.shade300),
                    Row(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.network(
                            widget.product.productThumbnail,
                            width: 60, height: 60, fit: BoxFit.cover,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(widget.product.productName,
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w600,
                                      fontSize: 14)),
                              const SizedBox(height: 4),
                              Text("Qty: ${widget.quantity}",
                                  style: TextStyle(color: Colors.grey.shade600,
                                      fontSize: 13)),
                              Text(
                                "Rs. ${(widget.product.sellPrice * widget.quantity).toStringAsFixed(2)}",
                                style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: Colors.green,
                                    fontSize: 15),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 32),

                    // ── Purchase button ─────────────────────────────────────
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: primaryColor2,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: _confirmPurchase,
                        child: const Text("Confirm Order",
                            style: TextStyle(
                                fontSize: 16,
                                color: Colors.white,
                                fontWeight: FontWeight.w600)),
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],
                ),
              ),

              // Loading overlay
              if (state is OrderLoading)
                Container(
                  color: Colors.black.withValues(alpha: 0.3),
                  child: const Center(
                      child: CupertinoActivityIndicator(radius: 20)),
                ),
            ],
          );
        },
      ),
    );
  }

  void _showSuccessDialog() {
    final isGuest = _isGuest;
    final guestName = _guestNameController.text.trim();
    final guestPhone = _guestPhoneController.text.trim();

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.check_circle, color: Colors.green, size: 28),
            SizedBox(width: 8),
            Text("Order Placed!"),
          ],
        ),
        content: Text(
          isGuest
              ? "Thanks, $guestName! Your order has been placed. We'll contact you at $guestPhone once it's on the way."
              : "Your order has been placed successfully. We'll notify you once it's on the way.",
        ),
        actions: [
          if (!isGuest)
            TextButton(
              child: const Text("View Orders"),
              onPressed: () => Get.offAll(() => const OrderListScreen()),
            ),
          TextButton(
            child: Text(isGuest ? "Continue Shopping" : "Home"),
            onPressed: () => Get.offAll(() => const HomeScreen()),
          ),
        ],
      ),
    );
  }

  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text("Order Failed"),
        content: Text(message),
        actions: [
          TextButton(
            child: const Text("OK"),
            onPressed: () => Navigator.of(context).pop(),
          ),
        ],
      ),
    );
  }
}
