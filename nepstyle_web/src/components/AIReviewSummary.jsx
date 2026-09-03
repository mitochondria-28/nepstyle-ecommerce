import { useEffect, useState } from 'react';
import { Sparkles, ThumbsUp, ThumbsDown, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { getReviewSummary } from '../api/aiApi';

const SENTIMENT_CONFIG = {
  positive: { label: 'Positive',  bg: 'bg-green-50',  border: 'border-green-200',  badge: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
  neutral:  { label: 'Mixed',     bg: 'bg-amber-50',  border: 'border-amber-200',  badge: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-500' },
  negative: { label: 'Critical',  bg: 'bg-red-50',    border: 'border-red-200',    badge: 'bg-red-100 text-red-700',      dot: 'bg-red-500'   },
};

function StarRow({ rating }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={14}
          className={s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
        />
      ))}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 bg-gray-200 rounded-xl" />
        <div className="h-5 w-48 bg-gray-200 rounded-lg" />
      </div>
      <div className="h-4 w-full bg-gray-100 rounded mb-2" />
      <div className="h-4 w-5/6 bg-gray-100 rounded mb-4" />
      <div className="flex gap-2 flex-wrap">
        {[1, 2, 3].map((i) => <div key={i} className="h-6 w-20 bg-gray-100 rounded-full" />)}
      </div>
    </div>
  );
}

export default function AIReviewSummary({ productId, reviewCount }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(true);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    // Only fetch once we know there are reviews
    if (!productId || reviewCount === 0 || fetched) return;
    setFetched(true);
    setLoading(true);
    getReviewSummary(productId)
      .then((r) => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [productId, reviewCount]);

  // Don't mount if no reviews yet
  if (!reviewCount) return null;
  if (loading) return <Skeleton />;
  if (!data?.success) return null;

  const cfg = SENTIMENT_CONFIG[data.overall_sentiment] ?? SENTIMENT_CONFIG.neutral;

  return (
    <div className={`rounded-2xl border ${cfg.border} ${cfg.bg} overflow-hidden`}>
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-primary rounded-xl flex items-center justify-center flex-shrink-0">
            <Sparkles size={16} className="text-white" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-primary text-sm">AI Review Summary</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.dot} mr-1`} />
                {cfg.label}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <StarRow rating={data.average_rating} />
              <span className="text-xs text-gray-500">
                {data.average_rating}/5 · {data.total_reviews} review{data.total_reviews !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
        {open ? <ChevronUp size={18} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />}
      </button>

      {/* Body */}
      {open && (
        <div className="px-5 pb-5 space-y-4">
          {!data.has_summary ? (
            <p className="text-sm text-gray-500 italic">{data.message}</p>
          ) : (
            <>
              {/* Summary paragraph */}
              {data.summary && (
                <p className="text-sm text-gray-700 leading-relaxed">{data.summary}</p>
              )}

              {/* Liked */}
              {data.liked?.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <ThumbsUp size={13} className="text-green-600" />
                    <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">What customers love</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {data.liked.map((item, i) => (
                      <span key={i} className="text-xs bg-green-100 text-green-700 border border-green-200 px-3 py-1 rounded-full font-medium">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Disliked */}
              {data.disliked?.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <ThumbsDown size={13} className="text-red-500" />
                    <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">Common concerns</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {data.disliked.map((item, i) => (
                      <span key={i} className="text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-full font-medium">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-400 pt-1">⚡ Generated by AI · Based on {data.total_reviews} verified reviews</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
