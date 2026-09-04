import { useEffect, useState } from 'react';
import { Flame, Sparkles, Star, Package, RefreshCw } from 'lucide-react';
import { getSmartDeals } from '../api/aiApi';
import ProductCard from '../components/ProductCard';
import { SkeletonCard } from '../components/LoadingSpinner';

const TABS = [
  { key: 'all',     label: 'All Deals'    },
  { key: 'hot',     label: '🔥 Hot Deals'  },
  { key: 'new',     label: '🆕 New Arrivals' },
];

const TIER_CONFIG = {
  hot:   { label: 'Hot Deal',   className: 'bg-red-500   text-white' },
  good:  { label: 'Good Value', className: 'bg-amber-400 text-white' },
  value: { label: 'On Sale',    className: 'bg-primary   text-white' },
};

function DealCard({ product }) {
  const tier = TIER_CONFIG[product.deal_tier];
  return (
    <div className="relative">
      {tier && product.discount_pct > 0 && (
        <span className={`absolute top-2 left-2 z-10 text-[10px] font-black px-2 py-0.5 rounded-full pointer-events-none ${tier.className}`}>
          {tier.label}
        </span>
      )}
      <ProductCard product={product} />
    </div>
  );
}

function StatsBar({ stats, loading }) {
  if (loading) return <div className="h-10 bg-white/20 animate-pulse rounded-xl" />;
  return (
    <div className="flex flex-wrap gap-4 text-sm">
      <span className="flex items-center gap-1.5 text-white/90 font-medium">
        <Flame size={14} className="text-orange-300" />
        {stats.hot_deals} hot deals
      </span>
      <span className="flex items-center gap-1.5 text-white/90 font-medium">
        <Star size={14} className="text-yellow-300 fill-yellow-300" />
        {stats.total_deals} on sale
      </span>
      <span className="flex items-center gap-1.5 text-white/90 font-medium">
        <Package size={14} className="text-blue-200" />
        {stats.new_arrivals} new arrivals
      </span>
      {stats.max_discount_pct > 0 && (
        <span className="bg-white/20 text-white font-bold text-xs px-2.5 py-1 rounded-full">
          Up to {stats.max_discount_pct}% off
        </span>
      )}
    </div>
  );
}

export default function DealsPage() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]       = useState('all');
  const [error, setError]   = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    getSmartDeals(24)
      .then(r => setData(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const products = (() => {
    if (!data) return [];
    if (tab === 'hot') return data.deals.filter(d => d.deal_tier === 'hot');
    if (tab === 'new') return data.new_arrivals;
    return [...data.deals, ...data.new_arrivals];
  })();

  const skeletons = Array.from({ length: 8 });

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* ── Hero banner ─────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-primary via-primary1 to-primary2 text-white">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex items-center gap-2 mb-3">
            <Flame size={22} className="text-orange-300" />
            <span className="text-xs font-black uppercase tracking-widest text-white/70">
              AI Deal Discovery
            </span>
            <span className="flex items-center gap-1 text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
              <Sparkles size={8} /> Powered by AI
            </span>
          </div>

          {loading ? (
            <div className="h-9 w-2/3 bg-white/20 animate-pulse rounded-xl mb-4" />
          ) : (
            <h1 className="text-2xl sm:text-3xl font-black leading-tight mb-4">
              {data?.headline || 'Best Deals on Fashion at NepStyle!'}
            </h1>
          )}

          <StatsBar stats={data?.stats || {}} loading={loading} />
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────── */}
      <div className="sticky top-16 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 py-2 overflow-x-auto scrollbar-hide">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-shrink-0 text-sm font-semibold px-4 py-2 rounded-xl transition-all ${
                  tab === t.key
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-500 hover:text-primary hover:bg-gray-50'
                }`}
              >
                {t.label}
                {t.key === 'hot' && data?.stats?.hot_deals > 0 && (
                  <span className="ml-1.5 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                    {data.stats.hot_deals}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Product grid ────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {error ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center">
            <Flame size={56} className="text-gray-200" />
            <p className="text-gray-400 text-sm">Could not load deals right now.</p>
            <button onClick={load} className="flex items-center gap-2 text-primary text-sm font-semibold hover:underline">
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {skeletons.map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-center">
            <Package size={56} className="text-gray-200" />
            <p className="text-gray-500 font-medium">No {tab === 'new' ? 'new arrivals' : 'deals'} in this category right now.</p>
            <button onClick={() => setTab('all')} className="text-primary text-sm font-semibold hover:underline">
              View all deals
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-400 mb-4">
              {products.length} {tab === 'new' ? 'new arrivals' : 'deals'} found
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map(p => (
                <DealCard key={`${p.product_id}-${tab}`} product={p} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
