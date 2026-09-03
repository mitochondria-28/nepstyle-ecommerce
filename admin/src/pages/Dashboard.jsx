import { useState, useEffect } from 'react';
import {
  Package, Tag, Building2, Zap, ShoppingBag,
  TrendingUp, RefreshCw, Clock, AlertCircle,
} from 'lucide-react';
import {
  fetchAllProducts, fetchAllCategories, fetchAllBrands,
  fetchAllFlashSales, fetchAllOrders,
} from '../api';

const STATUS_MAP = {
  pending:    { label: 'Pending',    cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  confirmed:  { label: 'Confirmed',  cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  processing: { label: 'Processing', cls: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  delivered:  { label: 'Delivered',  cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  cancelled:  { label: 'Cancelled',  cls: 'bg-red-100 text-red-700 border-red-200' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_MAP[status?.toLowerCase()] || STATUS_MAP.pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

const STAT_CARDS = [
  { key: 'products',   label: 'Total Products', icon: Package,    iconCls: 'text-blue-500',    bgCls: 'bg-blue-50' },
  { key: 'categories', label: 'Categories',      icon: Tag,        iconCls: 'text-emerald-500', bgCls: 'bg-emerald-50' },
  { key: 'brands',     label: 'Brands',          icon: Building2,  iconCls: 'text-violet-500',  bgCls: 'bg-violet-50' },
  { key: 'flashSales', label: 'Flash Sales',     icon: Zap,        iconCls: 'text-amber-500',   bgCls: 'bg-amber-50' },
  { key: 'orders',     label: 'Total Orders',    icon: ShoppingBag,iconCls: 'text-rose-500',    bgCls: 'bg-rose-50' },
];

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-50">
      {[1,2,3,4,5,6].map((i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 bg-gray-100 rounded animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState({ products: 0, categories: 0, brands: 0, flashSales: 0, orders: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(false);
    try {
      const results = await Promise.allSettled([
        fetchAllProducts(),
        fetchAllCategories(),
        fetchAllBrands(),
        fetchAllFlashSales(),
        fetchAllOrders(),
      ]);

      const [p, c, b, f, o] = results;

      setStats({
        products:   p.status === 'fulfilled' ? (p.value.data.products?.length ?? 0) : 0,
        categories: c.status === 'fulfilled' ? (c.value.data.categories?.length ?? 0) : 0,
        brands:     b.status === 'fulfilled' ? (b.value.data.brands?.length ?? 0) : 0,
        flashSales: f.status === 'fulfilled' ? (f.value.data.flash_sale_products?.length ?? 0) : 0,
        orders:     o.status === 'fulfilled' ? (o.value.data.orders?.length ?? 0) : 0,
      });

      if (o.status === 'fulfilled') {
        const all = o.value.data.orders || [];
        setRecentOrders([...all].reverse().slice(0, 10));
      }

      setLastUpdated(new Date());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="p-7 space-y-7 min-h-screen">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">{today}</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && !loading && (
            <span className="flex items-center gap-1.5 text-gray-400 text-xs">
              <Clock size={12} />
              {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2.5 text-red-700 text-sm">
          <AlertCircle size={16} />
          Could not connect to the backend server. Make sure it's running on port 8080.
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {STAT_CARDS.map(({ key, label, icon: Icon, iconCls, bgCls }) => (
          <div key={key} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 ${bgCls} rounded-xl flex items-center justify-center mb-4`}>
              <Icon size={19} className={iconCls} />
            </div>
            {loading ? (
              <div className="h-8 w-14 bg-gray-100 rounded animate-pulse mb-1" />
            ) : (
              <p className="text-3xl font-extrabold text-gray-900">{stats[key]}</p>
            )}
            <p className="text-xs text-gray-400 mt-1 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-indigo-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Recent Orders</h2>
          </div>
          {!loading && (
            <span className="text-[11px] text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
              Last {recentOrders.length}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/60">
                {['Order ID', 'User ID', 'Amount', 'Payment', 'Location', 'Status', 'Date'].map((h) => (
                  <th key={h} className="text-left px-6 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">
                    No orders yet
                  </td>
                </tr>
              ) : recentOrders.map((order, i) => (
                <tr key={order.order_id ?? i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3.5 text-sm font-semibold text-gray-900">#{order.order_id}</td>
                  <td className="px-6 py-3.5 text-sm text-gray-500">User #{order.user_id}</td>
                  <td className="px-6 py-3.5 text-sm font-bold text-gray-900">
                    Rs. {Number(order.total_amount || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-3.5 text-sm text-gray-500 capitalize">
                    {order.payment_method?.replace('_', ' ')}
                  </td>
                  <td className="px-6 py-3.5 text-sm text-gray-500 max-w-[160px]">
                    <span className="line-clamp-1">{order.delivery_location || '—'}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <StatusBadge status={order.order_status} />
                  </td>
                  <td className="px-6 py-3.5 text-sm text-gray-400">
                    {order.order_date ? new Date(order.order_date).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
