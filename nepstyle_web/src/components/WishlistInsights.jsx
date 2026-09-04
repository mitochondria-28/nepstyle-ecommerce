import { useEffect, useState } from 'react';
import { Sparkles, Tag, TrendingDown, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { getWishlistInsights } from '../api/aiApi';
import { useAuth } from '../context/AuthContext';

function Skeleton() {
  return (
    <div className="bg-gradient-to-r from-primary/5 to-primary2/5 border border-primary/10 rounded-2xl p-5 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 bg-primary/20 rounded-lg" />
        <div className="h-4 bg-primary/20 rounded w-40" />
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[1, 2, 3].map(i => <div key={i} className="h-14 bg-white/60 rounded-xl" />)}
      </div>
      <div className="h-3 bg-primary/10 rounded w-4/5" />
      <div className="h-3 bg-primary/10 rounded w-3/5 mt-1.5" />
    </div>
  );
}

export default function WishlistInsights({ items }) {
  const { user }              = useAuth();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (!items?.length) { setLoading(false); return; }
    const payload = items.map(i => ({
      product_id:    i.product_id,
      product_name:  i.product_name,
      sell_price:    Number(i.sell_price),
      normal_price:  Number(i.normal_price),
      category_name: i.category_name || '',
    }));
    setLoading(true);
    getWishlistInsights(payload, user?.user_id ?? null)
      .then(r => setData(r.data.insights))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [items?.length]);

  if (!loading && !data) return null;
  if (loading) return <Skeleton />;

  const hasSavings = data.on_sale_count > 0;

  return (
    <div className={`rounded-2xl border overflow-hidden mb-6 transition-all ${
      hasSavings
        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
        : 'bg-gradient-to-r from-primary/5 to-primary2/5 border-primary/10'
    }`}>
      {/* Header row — always visible */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-5 py-4"
      >
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
            hasSavings ? 'bg-green-500' : 'bg-gradient-to-br from-primary to-primary2'
          }`}>
            <Sparkles size={15} className="text-white" />
          </div>
          <div className="text-left">
            <p className={`font-bold text-sm ${hasSavings ? 'text-green-800' : 'text-primary'}`}>
              {hasSavings
                ? `${data.on_sale_count} item${data.on_sale_count > 1 ? 's' : ''} on sale — save Rs.${data.total_savings.toLocaleString()}!`
                : 'Your Wishlist Insights'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {data.total_items} item{data.total_items !== 1 ? 's' : ''} · Total value Rs.{data.total_wishlist_value.toLocaleString()}
            </p>
          </div>
        </div>
        {expanded
          ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" />
          : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
      </button>

      {/* Expandable body */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/80 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-primary">{data.total_items}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Saved items</p>
            </div>
            <div className="bg-white/80 rounded-xl p-3 text-center">
              <p className={`text-2xl font-bold ${hasSavings ? 'text-green-600' : 'text-gray-400'}`}>
                {data.on_sale_count}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">On sale</p>
            </div>
            <div className="bg-white/80 rounded-xl p-3 text-center">
              <p className={`text-2xl font-bold ${hasSavings ? 'text-green-600' : 'text-gray-400'}`}>
                {hasSavings ? `Rs.${data.total_savings.toLocaleString()}` : '—'}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">You save</p>
            </div>
          </div>

          {/* On-sale names */}
          {hasSavings && data.on_sale_names?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {data.on_sale_names.map(name => (
                <span key={name} className="flex items-center gap-1 text-[11px] bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
                  <Tag size={9} /> {name}
                </span>
              ))}
            </div>
          )}

          {/* Style tip */}
          {data.style_tip && (
            <div className="bg-white/70 rounded-xl p-3.5 flex gap-2.5 items-start">
              <Sparkles size={14} className="text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-700 leading-relaxed italic">"{data.style_tip}"</p>
            </div>
          )}

          {/* Best buy */}
          {data.best_buy && (
            <div className="flex items-center gap-2 text-sm">
              <Star size={13} className="text-amber-500 fill-amber-500 flex-shrink-0" />
              <span className="text-gray-500">Best buy first:</span>
              <span className="font-semibold text-primary truncate">{data.best_buy}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
