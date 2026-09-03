import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Search, ShoppingBag, X, RefreshCw } from 'lucide-react';
import { fetchAllOrders } from '../api';

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

const PAYMENT_ICONS = {
  cash: '💵',
  card: '💳',
  esewa: '🟢',
  khalti: '🟣',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchAllOrders();
      setOrders([...(res.data.orders || [])].reverse());
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let result = orders;
    if (statusFilter !== 'all') {
      result = result.filter((o) => o.order_status?.toLowerCase() === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((o) =>
        String(o.order_id).includes(q) ||
        String(o.user_id ?? '').includes(q) ||
        o.guest_name?.toLowerCase().includes(q) ||
        o.guest_phone?.toLowerCase().includes(q) ||
        o.payment_method?.toLowerCase().includes(q) ||
        o.delivery_location?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [orders, search, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts = {};
    orders.forEach((o) => {
      const s = o.order_status?.toLowerCase() || 'pending';
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [orders]);

  const totalRevenue = useMemo(
    () => orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
    [orders]
  );

  const statuses = ['all', ...Object.keys(STATUS_MAP)];

  return (
    <div className="p-7 space-y-5 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-400 text-sm mt-0.5">{orders.length} total orders · Rs. {totalRevenue.toLocaleString()} revenue</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Status summary chips */}
      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => {
          const cfg = STATUS_MAP[s];
          const count = s === 'all' ? orders.length : (statusCounts[s] || 0);
          const active = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                active
                  ? s === 'all'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : `${cfg.cls} border-current`
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {s === 'all' ? 'All' : cfg.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-sm">
        <Search size={15} className="text-gray-400 flex-shrink-0" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order ID, user ID, payment or location…"
          className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-400" />
        {search && <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-gray-300">
            <ShoppingBag size={44} className="mx-auto mb-3" />
            <p className="text-sm">Loading orders…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-gray-300">
            <ShoppingBag size={44} className="mx-auto mb-3" />
            <p className="text-sm">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100">
                  {['Order', 'User', 'Amount', 'Payment', 'Location', 'Status', 'Date'].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((order, i) => (
                  <tr key={order.order_id ?? i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">#{order.order_id}</td>
                    <td className="px-6 py-4">
                      {order.guest_name ? (
                        <div>
                          <p className="text-xs font-semibold text-gray-700">{order.guest_name}</p>
                          <p className="text-[11px] text-gray-400">{order.guest_phone}</p>
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold">Guest</span>
                        </div>
                      ) : (
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
                          User #{order.user_id}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                      Rs. {Number(order.total_amount || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                      {PAYMENT_ICONS[order.payment_method?.toLowerCase()] || '💰'} {order.payment_method?.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px]">
                      <span className="line-clamp-1">{order.delivery_location || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.order_status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">
                      {order.order_date ? new Date(order.order_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <p className="text-xs text-gray-400 text-center">
          Showing {filtered.length} of {orders.length} orders
        </p>
      )}
    </div>
  );
}
