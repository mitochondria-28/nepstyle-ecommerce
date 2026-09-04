import { useEffect, useState } from 'react';
import { Sparkles, Zap, Store, TrendingUp } from 'lucide-react';
import { getCategoryInsights } from '../api/aiApi';

function PriceBar({ min, max, avg }) {
  if (!max || max === 0) return null;
  const pct = Math.round(((avg - min) / (max - min)) * 100);
  return (
    <div className="mt-1">
      <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-primary/40 rounded-full"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-primary rounded-full shadow-sm border-2 border-white"
          style={{ left: `calc(${pct}% - 5px)` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
        <span>Rs {min.toLocaleString()}</span>
        <span className="text-primary font-semibold">avg Rs {avg.toLocaleString()}</span>
        <span>Rs {max.toLocaleString()}</span>
      </div>
    </div>
  );
}

export default function CategoryAIInsights({ catId }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!catId) return;
    setLoading(true);
    getCategoryInsights(catId)
      .then(r => setInsights(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [catId]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6 animate-pulse">
        <div className="h-3 w-40 bg-gray-200 rounded mb-3" />
        <div className="h-4 w-full bg-gray-100 rounded mb-2" />
        <div className="h-4 w-2/3 bg-gray-100 rounded mb-4" />
        <div className="flex gap-2">
          {[1, 2, 3].map(i => <div key={i} className="h-6 w-24 bg-gray-100 rounded-full" />)}
        </div>
      </div>
    );
  }

  if (!insights || !insights.ai_blurb) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={15} className="text-primary" />
        <span className="text-sm font-semibold text-gray-700">Category Insights</span>
        <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
          AI
        </span>
      </div>

      {/* AI blurb */}
      <p className="text-sm text-gray-600 leading-relaxed mb-4">
        {insights.ai_blurb}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Trending styles */}
        {insights.trending_styles?.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-2">
              <TrendingUp size={12} className="text-primary" />
              Trending Styles
            </div>
            <div className="flex flex-wrap gap-1.5">
              {insights.trending_styles.map(s => (
                <span
                  key={s}
                  className="flex items-center gap-1 text-xs bg-primary/8 text-primary font-medium px-2.5 py-1 rounded-full"
                >
                  <Zap size={9} />
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Top brands */}
        {insights.top_brands?.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-2">
              <Store size={12} className="text-primary" />
              Top Brands
            </div>
            <div className="flex flex-wrap gap-1.5">
              {insights.top_brands.map(b => (
                <span key={b} className="text-xs text-gray-600 border border-gray-200 px-2.5 py-1 rounded-full">
                  {b}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Price range */}
      {insights.price_range?.max > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-gray-500 mb-1">Price Range</p>
          <PriceBar
            min={insights.price_range.min}
            max={insights.price_range.max}
            avg={insights.price_range.avg}
          />
        </div>
      )}
    </div>
  );
}
