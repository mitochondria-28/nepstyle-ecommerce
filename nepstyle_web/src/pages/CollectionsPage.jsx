import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Sparkles, ArrowRight, RefreshCw, Clock } from 'lucide-react';
import { getCollections } from '../api/aiApi';

function formatCountdown(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function CollectionCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
      <div className="p-5 pb-3">
        <div className="flex items-start gap-3 mb-2">
          <div className="w-10 h-10 bg-gray-200 rounded-2xl flex-shrink-0" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-full" />
          </div>
        </div>
      </div>
      <div className="px-5 pb-3">
        <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="aspect-square bg-gray-100" />
          ))}
        </div>
      </div>
      <div className="px-5 pb-5">
        <div className="h-10 bg-gray-100 rounded-xl" />
      </div>
    </div>
  );
}

function CollectionCard({ collection }) {
  const navigate = useNavigate();
  const { name, description, emoji, search_query, products } = collection;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex items-start gap-3">
          <span className="text-3xl flex-shrink-0 leading-none mt-0.5">{emoji}</span>
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 text-base leading-tight truncate">{name}</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">{description}</p>
          </div>
        </div>
      </div>

      {/* 2×2 product image grid */}
      <div className="px-5 pb-3 flex-1">
        <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden bg-gray-50">
          {products.slice(0, 4).map((p, idx) => (
            <div key={p.product_id ?? idx} className="aspect-square overflow-hidden">
              <img
                src={p.product_thumbnail || p.image_url}
                alt={p.product_name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/200?text=Item'; }}
              />
            </div>
          ))}
          {/* Fill missing slots with placeholders */}
          {Array.from({ length: Math.max(0, 4 - products.length) }).map((_, i) => (
            <div key={`ph-${i}`} className="aspect-square bg-gray-100" />
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pb-5">
        <button
          onClick={() => navigate(`/search?q=${encodeURIComponent(search_query)}`)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-primary border border-primary/25 hover:bg-primary hover:text-white hover:border-primary transition-all duration-200"
        >
          Shop Collection <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

export default function CollectionsPage() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    getCollections()
      .then(r => setData(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const skeletons = Array.from({ length: 6 });

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* ── Hero ───────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-primary via-primary1 to-primary2 text-white">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex items-center gap-2 mb-3">
            <Layers size={20} className="text-primary3" />
            <span className="text-xs font-black uppercase tracking-widest text-white/70">
              AI Editorial
            </span>
            <span className="flex items-center gap-1 text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
              <Sparkles size={8} /> Powered by AI
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black leading-tight mb-2">
            Curated For You
          </h1>
          <div className="flex items-center gap-4 text-sm text-white/70">
            <span className="flex items-center gap-1.5">
              <Layers size={13} />
              6 themed collections
            </span>
            {data?.next_refresh_in > 0 && (
              <span className="flex items-center gap-1.5">
                <Clock size={13} />
                Refreshes in {formatCountdown(data.next_refresh_in)}
              </span>
            )}
            {data && !data.cached && (
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                Just generated
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Grid ───────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {error ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center">
            <Layers size={56} className="text-gray-200" />
            <p className="text-gray-400 text-sm">Could not load collections right now.</p>
            <button
              onClick={load}
              className="flex items-center gap-2 text-primary text-sm font-semibold hover:underline"
            >
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {skeletons.map((_, i) => <CollectionCardSkeleton key={i} />)}
          </div>
        ) : !data?.collections?.length ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-center">
            <Layers size={56} className="text-gray-200" />
            <p className="text-gray-500 font-medium">No collections available right now.</p>
            <button onClick={load} className="text-primary text-sm font-semibold hover:underline">
              Try again
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-5">
              {data.collections.length} collections · AI-curated{data.cached ? `, refreshes in ${formatCountdown(data.next_refresh_in)}` : ' · Just generated'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {data.collections.map((col, i) => (
                <CollectionCard key={`${col.name}-${i}`} collection={col} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
