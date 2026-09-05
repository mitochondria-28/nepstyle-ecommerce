import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapPin, CreditCard, Check, ArrowLeft, User, Phone, LogIn } from 'lucide-react';
import { placeOrder, placeCartOrder, placeSelectedCartOrder, initiateEsewaPayment } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const LOCATIONS = ['Kathmandu', 'Pokhara', 'Lalitpur', 'Bhaktapur', 'Chitwan', 'Biratnagar', 'Butwal'];
const PAYMENT_METHODS = [
  { name: 'eSewa',            img: '/images/esewa.png',  desc: 'Pay with eSewa digital wallet' },
  { name: 'Khalti',           img: '/images/khalti.png', desc: 'Pay with Khalti digital wallet' },
  { name: 'Cash on Delivery', img: '/images/cod.png',    desc: 'Pay when you receive the order' },
];

export default function CheckoutPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [paymentMethod, setPaymentMethod] = useState('');
  const [location, setLocation]           = useState('');
  const [guestName, setGuestName]         = useState('');
  const [guestPhone, setGuestPhone]       = useState('');
  const [loading, setLoading]             = useState(false);
  const [success, setSuccess]             = useState(false);

  const { selectedProductIds, isSelectAll, totalAmount, cartItems, product, quantity, isBuyNow } = state || {};

  // Cart checkout always needs a logged-in user — guest can only use Buy Now
  if (!user && !isBuyNow) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <LogIn size={56} className="text-primary3" />
        <h2 className="text-xl font-bold text-primary">Login Required</h2>
        <p className="text-gray-400 text-center">Please log in to checkout from your cart.</p>
        <button onClick={() => navigate('/login')} className="btn-primary px-8 py-3 rounded-xl">
          Login
        </button>
      </div>
    );
  }

  const buildOrderItems = () => {
    if (isBuyNow) {
      return [{
        product_id: product.product_id ?? product.productId,
        quantity,
        price: product.sell_price ?? product.sellPrice,
      }];
    }
    return (cartItems || []).map((item) => ({
      product_id: item.product_id ?? item.productId,
      quantity: item.quantity,
      price: item.sell_price ?? item.sellPrice,
    }));
  };

  const handleEsewa = async () => {
    const items = buildOrderItems();
    let cartType = 'direct';
    if (!isBuyNow) {
      cartType = isSelectAll ? 'cart_all' : 'cart_selected';
    }

    const payload = {
      user_id:           user?.user_id ?? null,
      guest_name:        !user ? guestName.trim()  : null,
      guest_phone:       !user ? guestPhone.trim() : null,
      total_amount:      Number(totalAmount),
      delivery_location: location,
      cart_type:         cartType,
      items,
      ...(cartType === 'cart_selected' && { selected_product_ids: selectedProductIds }),
    };

    const res = await initiateEsewaPayment(payload);
    const { deeplink } = res.data;

    // Redirect browser to eSewa's payment page (works on both desktop and mobile)
    window.location.href = deeplink;
  };

  const handleNonEsewa = async () => {
    let res;
    if (isBuyNow) {
      res = await placeOrder({
        user_id:           user?.user_id ?? null,
        guest_name:        !user ? guestName.trim()  : null,
        guest_phone:       !user ? guestPhone.trim() : null,
        total_amount:      Number(totalAmount),
        payment_method:    paymentMethod,
        delivery_location: location,
        items: [{
          product_id: product.product_id ?? product.productId,
          quantity,
          price: product.sell_price ?? product.sellPrice,
        }],
      });
    } else if (isSelectAll) {
      res = await placeCartOrder({
        user_id: user.user_id, payment_method: paymentMethod, delivery_location: location,
      });
    } else {
      res = await placeSelectedCartOrder({
        user_id: user.user_id, product_ids: selectedProductIds,
        payment_method: paymentMethod, delivery_location: location,
      });
    }

    if (res.data.status) {
      setSuccess(true);
    } else {
      toast.error('Failed to place order');
    }
  };

  const handleConfirm = async () => {
    if (!paymentMethod) { toast.error('Please select a payment method'); return; }
    if (!location)      { toast.error('Please select a delivery location'); return; }

    if (!user) {
      if (!guestName.trim())  { toast.error('Please enter your full name'); return; }
      if (!guestPhone.trim()) { toast.error('Please enter your contact number'); return; }
      if (!/^\d{7,15}$/.test(guestPhone.trim())) {
        toast.error('Please enter a valid contact number'); return;
      }
    }

    setLoading(true);
    try {
      if (paymentMethod === 'eSewa') {
        await handleEsewa();
        // Redirect happens inside — no further state update needed
      } else {
        await handleNonEsewa();
      }
    } catch {
      toast.error('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <Check size={48} className="text-green-500" strokeWidth={3} />
        </div>
        <h2 className="text-2xl font-bold text-primary mb-2">Order Placed!</h2>
        {user ? (
          <>
            <p className="text-gray-500 mb-8">Your order has been placed successfully. We'll notify you once it's on the way.</p>
            <div className="flex gap-3 w-full">
              <button onClick={() => navigate('/orders')} className="flex-1 btn-primary py-3 rounded-xl">View Orders</button>
              <button onClick={() => navigate('/')} className="flex-1 btn-secondary py-3 rounded-xl">Continue Shopping</button>
            </div>
          </>
        ) : (
          <>
            <p className="text-gray-500 mb-2">
              Your order has been placed successfully, <span className="font-semibold text-primary">{guestName}</span>!
            </p>
            <p className="text-gray-400 text-sm mb-8">
              We'll contact you at <span className="font-medium text-primary">{guestPhone}</span> once it's on the way.
            </p>
            <div className="flex gap-3 w-full">
              <button onClick={() => navigate('/register')} className="flex-1 btn-primary py-3 rounded-xl">Create Account</button>
              <button onClick={() => navigate('/')} className="flex-1 btn-secondary py-3 rounded-xl">Continue Shopping</button>
            </div>
          </>
        )}
      </div>
    );
  }

  const displayItems = isBuyNow
    ? [{ product_name: product?.product_name ?? product?.productName, quantity, sell_price: product?.sell_price ?? product?.sellPrice }]
    : (cartItems || []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-primary2 mb-6 hover:text-primary">
        <ArrowLeft size={18} /> Back
      </button>
      <h1 className="text-2xl font-bold text-primary mb-6">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-5">

          {/* Guest info — only shown when not logged in */}
          {!user && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <User size={20} className="text-primary2" />
                <h3 className="font-bold text-primary">Your Information</h3>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                No account needed —{' '}
                <button onClick={() => navigate('/login')} className="text-primary underline underline-offset-2">
                  Login
                </button>{' '}
                if you already have one.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Enter your full name"
                      className="input-field pl-9"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Contact Number
                  </label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="e.g. 9800000000"
                      className="input-field pl-9"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delivery Location */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={20} className="text-primary2" />
              <h3 className="font-bold text-primary">Delivery Location</h3>
            </div>
            <select
              className="input-field"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option value="">Select your city</option>
              {LOCATIONS.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
            </select>
          </div>

          {/* Payment Methods */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard size={20} className="text-primary2" />
              <h3 className="font-bold text-primary">Payment Method</h3>
            </div>
            <div className="space-y-2">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.name}
                  onClick={() => setPaymentMethod(method.name)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all ${
                    paymentMethod === method.name
                      ? 'border-primary bg-primary4/30'
                      : 'border-gray-100 hover:border-primary3'
                  }`}
                >
                  <img src={method.img} alt={method.name} className="w-10 h-10 object-contain rounded-lg flex-shrink-0" />
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-primary text-sm">{method.name}</p>
                    <p className="text-xs text-gray-400">{method.desc}</p>
                  </div>
                  {paymentMethod === method.name && <Check size={18} className="text-primary" />}
                </button>
              ))}
            </div>
            {paymentMethod === 'eSewa' && (
              <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400" />
                You'll be redirected to eSewa to complete payment securely.
              </p>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <div className="bg-white rounded-2xl p-5 shadow-sm sticky top-24">
            <h3 className="font-bold text-primary text-lg mb-4">Order Details</h3>
            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
              <div className="grid grid-cols-4 text-xs font-bold text-gray-500 border-b pb-2">
                <span className="col-span-2">Product</span>
                <span className="text-center">Qty</span>
                <span className="text-right">Total</span>
              </div>
              {displayItems.map((item, i) => (
                <div key={i} className="grid grid-cols-4 text-sm py-1.5 border-b border-gray-50">
                  <span className="col-span-2 text-primary font-medium truncate pr-2">{item.product_name}</span>
                  <span className="text-center text-gray-500">{item.quantity}</span>
                  <span className="text-right text-moneyColor font-semibold">
                    Rs.{(item.sell_price * item.quantity).toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center font-bold text-primary pt-2 border-t">
              <span>Total Amount</span>
              <span className="text-moneyColor text-xl">Rs.{Number(totalAmount).toFixed(2)}</span>
            </div>
            <button
              onClick={handleConfirm}
              disabled={loading || !paymentMethod || !location}
              className="w-full btn-primary py-3.5 rounded-xl mt-5 text-base disabled:opacity-50"
            >
              {loading
                ? (paymentMethod === 'eSewa' ? 'Redirecting to eSewa...' : 'Placing Order...')
                : (paymentMethod === 'eSewa' ? 'Pay with eSewa' : 'Confirm Order')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
