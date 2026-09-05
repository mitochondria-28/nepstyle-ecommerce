import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, CreditCard, Package } from 'lucide-react';

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'delivered'];

const STATUS_LABELS = {
  pending:    'Pending',
  confirmed:  'Confirmed',
  processing: 'Processing',
  delivered:  'Delivered',
  cancelled:  'Cancelled',
};

const STATUS_CONFIG = {
  pending:    { cls: 'bg-amber-100 text-amber-700' },
  confirmed:  { cls: 'bg-blue-100 text-blue-700' },
  processing: { cls: 'bg-indigo-100 text-indigo-700' },
  delivered:  { cls: 'bg-green-100 text-green-700' },
  cancelled:  { cls: 'bg-red-100 text-red-700' },
};

export default function OrderDetailPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const order = state?.order;

  if (!order) { navigate('/orders'); return null; }

  const statusKey  = order.order_status?.toLowerCase() || 'pending';
  const isCancelled = statusKey === 'cancelled';
  const currentStep = STATUS_STEPS.indexOf(statusKey);
  const statusCfg  = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-primary2 mb-6 hover:text-primary">
        <ArrowLeft size={18} /> Back
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">Order #{order.order_id}</h1>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-3 py-1 rounded-full font-semibold ${statusCfg.cls}`}>
            {STATUS_LABELS[statusKey] || statusKey}
          </span>
          <span className="text-sm text-gray-400">
            {new Date(order.created_at || order.order_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Status Tracker */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
        <h3 className="font-bold text-primary mb-4">Order Status</h3>

        {isCancelled ? (
          <div className="flex items-center gap-3 py-2">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 font-bold text-sm">✕</div>
            <div>
              <p className="text-sm font-semibold text-red-600">Order Cancelled</p>
              <p className="text-xs text-gray-400">This order was cancelled.</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between relative">
            {/* background track */}
            <div className="absolute top-3.5 left-0 right-0 h-0.5 bg-gray-200 z-0" />
            {/* progress fill */}
            <div
              className="absolute top-3.5 left-0 h-0.5 bg-primary z-0 transition-all duration-500"
              style={{
                width: currentStep < 0
                  ? '0%'
                  : `${(currentStep / (STATUS_STEPS.length - 1)) * 100}%`,
              }}
            />
            {STATUS_STEPS.map((step, i) => {
              const done   = i < currentStep;
              const active = i === currentStep;
              return (
                <div key={step} className="flex flex-col items-center relative z-10">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                    ${done || active ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'}`}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span className={`text-[11px] mt-1.5 font-medium text-center ${done || active ? 'text-primary' : 'text-gray-400'}`}>
                    {STATUS_LABELS[step]}
                  </span>
                </div>
              );
            })}
          </div>
        )}
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
