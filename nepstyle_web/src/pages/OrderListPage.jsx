import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ArrowLeft, ChevronRight } from 'lucide-react';
import { fetchUserOrders } from '../api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import AIOrderAssistant from '../components/AIOrderAssistant';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function OrderListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await fetchUserOrders(user.user_id);
      setOrders(res.data.orders || []);
    } catch { setOrders([]); }
    finally { setLoading(false); }
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-primary2 mb-4 hover:text-primary">
        <ArrowLeft size={18} /> Back
      </button>
      <h1 className="text-2xl font-bold text-primary mb-6">My Orders</h1>

      {/* AI Order Assistant */}
      {user && (
        <div className="mb-5">
          <AIOrderAssistant userId={user.user_id} orderCount={orders.length} />
        </div>
      )}

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 bg-white rounded-2xl shadow-sm py-16">
          <Package size={80} className="text-primary3" />
          <h2 className="text-xl font-semibold text-primary">No orders yet</h2>
          <p className="text-gray-400">Your order history will appear here</p>
          <button onClick={() => navigate('/')} className="btn-primary px-8 py-3 rounded-xl">Shop Now</button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.order_id}
              onClick={() => navigate('/orders/' + order.order_id, { state: { order } })}
              className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-primary4 rounded-full flex items-center justify-center flex-shrink-0">
                <Package size={22} className="text-primary2" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-primary text-sm">Order #{order.order_id}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(order.created_at || order.order_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status?.toLowerCase()] || 'bg-gray-100 text-gray-600'}`}>
                    {order.status || 'Pending'}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500">{order.payment_method}</p>
                  <p className="font-bold text-moneyColor text-sm">Rs.{Number(order.total_amount).toFixed(2)}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
