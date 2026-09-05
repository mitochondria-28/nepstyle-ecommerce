import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Search, ShoppingBag, X, RefreshCw, ChevronDown } from 'lucide-react';
import { fetchAllOrders, updateOrderStatus } from '../api';

const STATUS_MAP = {
  pending:    { label: 'Pending',    cls: 'bg-amber-100 text-amber-700 border-amber-200',    dot: 'bg-amber-400' },
  confirmed:  { label: 'Confirmed',  cls: 'bg-blue-100 text-blue-700 border-blue-200',       dot: 'bg-blue-400' },
  processing: { label: 'Processing', cls: 'bg-indigo-100 text-indigo-700 border-indigo-200', dot: 'bg-indigo-400' },
  delivered:  { label: 'Delivered',  cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400' },
  cancelled:  { label: 'Cancelled',  cls: 'bg-red-100 text-red-700 border-red-200',          dot: 'bg-red-400' },
};

const STATUS_ORDER = ['pending', 'confirmed', 'processing', 'delivered', 'cancelled'];

const PAYMENT_ICONS = {
  'cash on delivery': '💵',
  card:   '💳',
  esewa:  '🟢',
  khalti: '🟣',
};

function StatusDropdown({ orderId, current, onChanged }) {
  const [open, setOpen]       = useState(false);
  const [saving, setSaving]   = useState(false);
  const cfg = STATUS_MAP[current?.toLowerCase()] || STATUS_MAP.pending;

  const handleSelect = async (next) => {
    if (next === current?.toLowerCase()) { setOpen(false); return; }
    setSaving(true);
    setOpen(false);
    try {
      await updateOrderStatus(orderId, next);
      onChanged(orderId, next);
      toast.success(`Order #${orderId} → ${STATUS_MAP[next].label}`);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={saving}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all
          ${cfg.cls} ${saving ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        {saving ? 'Saving…' : cfg.label}
        {!saving && <ChevronDown size={11} />}
      </button>

      {open && (
        <>
          {/* backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[140px]">
            {STATUS_ORDER.map((s) => {
              const c = STATUS_MAP[s];
              const isActive = s === current?.toLowerCase();
              return (
                <button
                  key={s}
                  onClick={() => handleSelect(s)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-left transition-colors
                    ${isActive ? 'bg-gray-50 text-gray-400 cursor-default' : 'hover:bg-gray-50 text-gray-700'}`}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
                  {c.label}
                  {isActive && <span className="ml-auto text-[10px] text-gray-300">current</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
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

  const handleStatusChanged = (orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((o) => o.order_id === orderId ? { ...o, order_status: newStatus } : o)
    );
  };

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

  const statuses = ['all', ...STATUS_ORDER];

  return (
    <div className="p-7 space-y-5 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {orders.length} total · Rs. {totalRevenue.toLocaleString()} revenue
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => {
          const cfg = STATUS_MAP[s];
          const count = s === 'all' ? orders.length : (statusCounts[s] || 0);
          const active = statusFilter === s;
          return (
            <button key={s} onClick={() => setStatusFilter(s)}
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
          placeholder="Search by order ID, user, payment or location…"
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
                  {['Order', 'Customer', 'Amount', 'Payment', 'Location', 'Status', 'Date'].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((order, i) => {
                  const payKey = order.payment_method?.toLowerCase();
                  const payIcon = PAYMENT_ICONS[payKey] || '💰';
                  return (
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
                        {payIcon} {order.payment_method?.replace(/_/g, ' ')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-[160px]">
                        <span className="line-clamp-1">{order.delivery_location || '—'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusDropdown
                          orderId={order.order_id}
                          current={order.order_status}
                          onChanged={handleStatusChanged}
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">
                        {order.order_date
                          ? new Date(order.order_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
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
