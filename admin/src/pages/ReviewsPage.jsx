import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Star, MessageSquare, RefreshCw, Filter } from 'lucide-react';
import { fetchReviews, fetchAllProducts } from '../api';

function StarRating({ rating }) {
  const r = Math.round(Number(rating) || 0);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={13}
          className={i < r ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
        />
      ))}
      <span className="ml-1.5 text-xs font-semibold text-gray-500">{Number(rating || 0).toFixed(1)}</span>
    </div>
  );
}

function RatingBar({ label, count, total }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-4 text-right">{label}</span>
      <Star size={11} className="text-amber-400 fill-amber-400 flex-shrink-0" />
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <div className="bg-amber-400 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-400 w-4">{count}</span>
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchAllProducts();
        setProducts(res.data.products || []);
      } catch {
        toast.error('Failed to load products');
      } finally {
        setProductsLoading(false);
      }
    })();
  }, []);

  const load = async (productId) => {
    setLoading(true);
    try {
      const res = await fetchReviews(productId || undefined);
      setReviews(res.data.data || []);
    } catch {
      toast.error('Failed to load reviews');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(selectedProduct); }, [selectedProduct]);

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length).toFixed(1)
    : '0.0';

  const ratingCounts = [5, 4, 3, 2, 1].map((n) => ({
    label: n,
    count: reviews.filter((r) => Math.round(Number(r.rating)) === n).length,
  }));

  return (
    <div className="p-7 space-y-5 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
          <p className="text-gray-400 text-sm mt-0.5">{reviews.length} reviews{selectedProduct ? ' for selected product' : ' total'}</p>
        </div>
        <button onClick={() => load(selectedProduct)} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filter & Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Product filter */}
        <div className="md:col-span-2 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={14} className="text-gray-400" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filter by Product</span>
          </div>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-700"
            disabled={productsLoading}
          >
            <option value="">All Products</option>
            {products.map((p) => (
              <option key={p.product_id} value={p.product_id}>
                [{p.product_id}] {p.product_name}
              </option>
            ))}
          </select>
        </div>

        {/* Rating summary */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Rating Overview</span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl font-extrabold text-gray-900">{avgRating}</span>
            <div>
              <StarRating rating={avgRating} />
              <p className="text-xs text-gray-400 mt-0.5">{reviews.length} reviews</p>
            </div>
          </div>
          <div className="space-y-1.5">
            {ratingCounts.map(({ label, count }) => (
              <RatingBar key={label} label={label} count={count} total={reviews.length} />
            ))}
          </div>
        </div>
      </div>

      {/* Reviews list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-gray-300">
            <MessageSquare size={44} className="mx-auto mb-3" />
            <p className="text-sm">Loading reviews…</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-20 text-center text-gray-300">
            <MessageSquare size={44} className="mx-auto mb-3" />
            <p className="text-sm">No reviews found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100">
                  {['User', 'Product ID', 'Rating', 'Comment', 'Date'].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reviews.map((review, i) => (
                  <tr key={review.review_id ?? i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-indigo-600 text-xs font-bold">
                            {(review.user_name || 'U')[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{review.user_name || 'Anonymous'}</p>
                          <p className="text-xs text-gray-400">ID #{review.user_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
                        #{review.product_id}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StarRating rating={review.rating} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                      <p className="line-clamp-2">{review.comment || '—'}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">
                      {review.created_at
                        ? new Date(review.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
