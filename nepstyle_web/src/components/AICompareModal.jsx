import { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, Check, Star, TrendingUp } from 'lucide-react';
import axios from 'axios';

const AI_BASE = import.meta.env.VITE_AI_SERVICE_URL || 'https://ai-service-production-7d9f.up.railway.app';
const AI_KEY  = import.meta.env.VITE_AI_API_KEY || '';

const aiAxios = axios.create({
  baseURL: AI_BASE,
  headers: { 'Content-Type': 'application/json', ...(AI_KEY ? { 'X-AI-Key': AI_KEY } : {}) },
  timeout: 30000,
});

export default function AICompareModal({ productA, similarProducts, onClose }) {
  const [selected, setSelected]   = useState(null);
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const runCompare = async () => {
    if (!selected) return;
    setLoading(true);
    setError('');
    try {
      const res = await aiAxios.post('/ai/compare', {
        product_ids: [productA.product_id, selected.product_id],
      });
      setResult(res.data);
    } catch (e) {
      setError('Comparison failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center px-4 py-6">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary2 rounded-xl flex items-center justify-center">
            <Sparkles size={15} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-primary text-sm">AI Product Comparison</p>
            <p className="text-xs text-gray-400">Compare {productA.product_name} with a similar product</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!result ? (
            <div className="px-6 py-5">
              {/* Product A */}
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Comparing</p>
                <div className="flex items-center gap-3 bg-primary4 rounded-xl p-3">
                  <img
                    src={productA.product_thumbnail}
                    alt={productA.product_name}
                    className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/48?text=?'; }}
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-primary text-sm truncate">{productA.product_name}</p>
                    <p className="text-primary2 text-xs font-semibold">Rs.{Number(productA.sell_price).toLocaleString()}</p>
                  </div>
                  <div className="ml-auto">
                    <span className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <Check size={12} className="text-white" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Select Product B */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Compare with</p>
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {similarProducts.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No similar products found.</p>
                  ) : (
                    similarProducts.map((p) => (
                      <button
                        key={p.product_id}
                        onClick={() => setSelected(p)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                          selected?.product_id === p.product_id
                            ? 'border-primary bg-primary4'
                            : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                        }`}
                      >
                        <img
                          src={p.product_thumbnail || p.thumbnail}
                          alt={p.product_name || p.name}
                          className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/48?text=?'; }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 text-sm truncate">{p.product_name || p.name}</p>
                          <p className="text-gray-500 text-xs">Rs.{Number(p.sell_price).toLocaleString()}</p>
                        </div>
                        {selected?.product_id === p.product_id && (
                          <span className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                            <Check size={12} className="text-white" />
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {error && <p className="mt-3 text-sm text-red-500 text-center">{error}</p>}

              <button
                onClick={runCompare}
                disabled={!selected || loading}
                className="mt-5 w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary1 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-colors"
              >
                {loading ? (
                  <><Loader2 size={18} className="animate-spin" /> Comparing with AI…</>
                ) : (
                  <><Sparkles size={18} /> Compare Now</>
                )}
              </button>
            </div>
          ) : (
            <CompareResult result={result} onReset={() => setResult(null)} />
          )}
        </div>
      </div>
    </div>
  );
}

function CompareResult({ result, onReset }) {
  const { products, comparison } = result;
  const table  = comparison?.comparison_table || [];
  const bestFor = comparison?.best_for || {};
  const rec    = comparison?.recommendation || comparison?.raw || '';

  return (
    <div className="px-6 py-5 space-y-5">
      {/* Product headers */}
      <div className="grid grid-cols-2 gap-3">
        {products.map((p) => (
          <div key={p.product_id} className="bg-gray-50 rounded-xl p-3 text-center">
            <img
              src={p.thumbnail}
              alt={p.product_name}
              className="w-16 h-16 object-cover rounded-xl mx-auto mb-2"
              onError={(e) => { e.target.src = 'https://via.placeholder.com/64?text=?'; }}
            />
            <p className="font-bold text-primary text-xs leading-tight">{p.product_name}</p>
            <p className="text-moneyColor font-semibold text-sm mt-1">Rs.{Number(p.sell_price).toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Best for badges */}
      {Object.keys(bestFor).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(bestFor).map(([k, v]) => (
            <span key={k} className="text-xs bg-primary4 text-primary font-semibold px-3 py-1 rounded-full">
              {k.replace(/_/g, ' ')}: <strong>{v}</strong>
            </span>
          ))}
        </div>
      )}

      {/* Comparison table */}
      {table.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-2.5 font-bold text-gray-500 text-xs uppercase tracking-wide">Attribute</th>
                {products.map((p) => (
                  <th key={p.product_id} className="text-left px-4 py-2.5 font-bold text-primary text-xs">
                    {p.product_name.split(' ').slice(0, 2).join(' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <td className="px-4 py-2.5 font-semibold text-gray-600 text-xs">{row.attribute}</td>
                  {products.map((p) => (
                    <td key={p.product_id} className="px-4 py-2.5 text-gray-800 text-xs">
                      {row.values?.[p.product_name] || '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* AI Recommendation */}
      {rec && (
        <div className="bg-gradient-to-br from-primary4 to-white border border-primary3/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-primary" />
            <p className="text-xs font-bold text-primary uppercase tracking-wider">AI Recommendation</p>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{rec}</p>
        </div>
      )}

      <button
        onClick={onReset}
        className="w-full text-sm text-gray-500 border border-gray-200 rounded-xl py-2.5 hover:border-primary hover:text-primary transition-colors font-medium"
      >
        Compare Different Products
      </button>
    </div>
  );
}
