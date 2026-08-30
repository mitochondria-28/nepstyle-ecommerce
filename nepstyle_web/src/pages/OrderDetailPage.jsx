import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, CreditCard, Package } from 'lucide-react';

const STATUS_STEPS = ['Pending', 'Processing', 'Shipped', 'Delivered'];

export default function OrderDetailPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const order = state?.order;

  if (!order) { navigate('/orders'); return null; }

  const currentStep = STATUS_STEPS.findIndex((s) => s.toLowerCase() === order.status?.toLowerCase());

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-primary2 mb-6 hover:text-primary">
        <ArrowLeft size={18} /> Back
      </button>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">Order #{order.order_id}</h1>
        <span className="text-sm text-gray-400">{new Date(order.created_at || order.order_date).toLocaleDateString()}</span>
      </div>

      {/* Status Tracker */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
        <h3 className="font-bold text-primary mb-4">Order Status</h3>
        <div className="flex items-center justify-between relative">
          <div className="absolute top-3 left-0 right-0 h-0.5 bg-gray-200 z-0" />
          <div
            className="absolute top-3 left-0 h-0.5 bg-primary z-0 transition-all"
            style={{ width: `${(Math.max(0, currentStep) / (STATUS_STEPS.length - 1)) * 100}%` }}
          />
          {STATUS_STEPS.map((step, i) => (
            <div key={step} className="flex flex-col items-center relative z-10">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i <= currentStep ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'}`}>
                {i < currentStep ? '✓' : i + 1}
              </div>
              <span className={`text-xs mt-1 font-medium ${i <= currentStep ? 'text-primary' : 'text-gray-400'}`}>{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Order Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={16} className="text-primary2" />
            <span className="font-semibold text-primary text-sm">Delivery Location</span>
          </div>
          <p className="text-gray-600 text-sm">{order.delivery_location || 'Not specified'}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard size={16} className="text-primary2" />
            <span className="font-semibold text-primary text-sm">Payment Method</span>
          </div>
          <p className="text-gray-600 text-sm">{order.payment_method || 'Not specified'}</p>
        </div>
      </div>

      {/* Order Items */}
      {order.items?.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
          <h3 className="font-bold text-primary mb-4">Order Items</h3>
          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 pb-3 border-b border-gray-50 last:border-0">
                <div className="w-10 h-10 bg-primary4 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package size={18} className="text-primary2" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary">Product #{item.product_id}</p>
                  <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                </div>
                <p className="font-bold text-moneyColor text-sm">Rs.{(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Total */}
      <div className="bg-primary rounded-2xl p-5 text-white">
        <div className="flex justify-between items-center">
          <span className="font-semibold">Total Amount</span>
          <span className="text-2xl font-bold">Rs.{Number(order.total_amount).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
