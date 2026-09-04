import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search, SlidersHorizontal, X, Sparkles, ChevronDown,
  AlertCircle, Package, TrendingUp, Zap,
} from 'lucide-react';
import { searchProducts } from '../api';
import { aiSearch, getSearchSuggestions } from '../api/aiApi';
import { fetchAllCategories } from '../api';
import { fetchAllBrands } from '../api';
import ProductCard from '../components/ProductCard';
import { SkeletonCard } from '../components/LoadingSpinner';

const PRICE_PRESETS = [
  { label: 'Under Rs.1,000', max: 1000 },
  { label: 'Rs.1,000 – 3,000', min: 1000, max: 3000 },
  { label: 'Rs.3,000 – 7,000', min: 3000, max: 7000 },
  { label: 'Above Rs.7,000', min: 7000 },
];

const SUGGESTIONS = [
  'warm winter jacket',
  'running shoes for men',
  'casual summer dress',
  'formal office wear',
  'sports hoodie under 2000',
];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [input, setInput]             = useState(query);
  const [products, setProducts]       = useState([]);
  const [loading, setLoading]         = useState(false);
  const [searched, setSearched]       = useState(false);
  const [isAI, setIsAI]               = useState(false);
  const [total, setTotal]             = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const [categories, setCategories] = useState([]);
  const [brands, setBrands]         = useState([]);

  const [filters, setFilters] = useState({
    category_id: '',
    brand_id: '',
    min_price: '',
    max_price: '',
    in_stock: false,
  });

  const inputRef = useRef(null);

  // Load filter options once
  useEffect(() => {
    fetchAllCategories().then((r) => setCategories(r.data.categories || [])).catch(() => {});
    fetchAllBrands().then((r) => setBrands(r.data.brands || [])).catch(() => {});
  }, []);

  // Run search whenever URL query changes
  useEffect(() => {
    if (query) {
      setInput(query);
      doSearch(query);
    }
  }, [query]);

  const buildFilters = () => {
    const f = {};
    if (filters.category_id) f.category_id = Number(filters.category_id);
    if (filters.brand_id)    f.brand_id    = Number(filters.brand_id);
    if (filters.min_price)   f.min_price   = Number(filters.min_price);
    if (filters.max_price)   f.max_price   = Number(filters.max_price);
    if (filters.in_stock)    f.in_stock    = true;
    return f;
  };

  const doSearch = async (q) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    setIsAI(false);
    setSuggestions([]);

    const f = buildFilters();

    try {
      // Try AI hybrid search first
      const res = await aiSearch(q, f, 1, 24);
      const data = res.data;
      if (data.success && data.results?.length >= 0) {
        setProducts(data.results.map((r) => r.product || r));
        setTotal(data.total || data.results.length);
        setIsAI(true);
        // Fire refinement suggestions in parallel — non-blocking
        setSuggestions([]);
        getSearchSuggestions(q)
          .then(r => setSuggestions(r.data.suggestions || []))
          .catch(() => setSuggestions([]));
        return;
      }
    } catch {
      // Fall through to regular search
    }

    try {
      const res = await searchProducts(q);
      const list = res.data.products || [];
      let filtered = list;
      if (f.category_id) filtered = filtered.filter((p) => p.category_id === f.category_id);
      if (f.brand_id)    filtered = filtered.filter((p) => p.brand_id    === f.brand_id);
      if (f.min_price)   filtered = filtered.filter((p) => p.sell_price >= f.min_price);
      if (f.max_price)   filtered = filtered.filter((p) => p.sell_price <= f.max_price);
      if (f.in_stock)    filtered = filtered.filter((p) => (p.total_product_count || 0) > 0);
      setProducts(filtered);
      setTotal(filtered.length);
    } catch {
      setProducts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setSearchParams({ q: input.trim() });
  };

  const handleSuggestion = (s) => {
    setInput(s);
    setSearchParams({ q: s });
  };

  const applyPricePreset = (preset) => {
    setFilters((f) => ({
      ...f,
      min_price: preset.min ?? '',
      max_price: preset.max ?? '',
    }));
  };

  const resetFilters = () =>
    setFilters({ category_id: '', brand_id: '', min_price: '', max_price: '', in_stock: false });

  const activeFilterCount = [
    filters.category_id, filters.brand_id,
    filters.min_price, filters.max_price,
    filters.in_stock,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* ── Search hero ─────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-primary" />
              <span className="text-xs font-bold text-primary uppercase tracking-widest">
                AI-Powered Search
              </span>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="relative flex items-center gap-2">
                <div className="relative flex-1">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder='Try "warm jacket under 3000" or "casual summer dress"…'
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-2xl text-sm placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200"
                    autoFocus
                  />
                  {input && (
                    <button
                      type="button"
                      onClick={() => { setInput(''); inputRef.current?.focus(); }}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="flex-shrink-0 bg-primary hover:bg-primary1 text-white font-bold px-5 py-3.5 rounded-2xl text-sm transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
                >
                  <Search size={16} />
                  <span className="hidden sm:inline">Search</span>
                </button>
              </div>
            </form>

            {/* Suggestions */}
            {!searched && (
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-xs text-gray-400 self-center">Try:</span>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSuggestion(s)}
                    className="text-xs bg-gray-100 hover:bg-primary4 hover:text-primary text-gray-600 px-3 py-1.5 rounded-full transition-colors font-medium"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* ── Results header ────────────────────────────────── */}
        {searched && !loading && (
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <p className="text-sm text-gray-600">
                {total > 0 ? (
                  <>
                    <span className="font-bold text-gray-900">{total}</span> results for{' '}
                    <span className="font-bold text-primary">"{query}"</span>
                  </>
                ) : (
                  <>No results for <span className="font-bold text-primary">"{query}"</span></>
                )}
              </p>
              {isAI && total > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-gradient-to-r from-primary to-primary2 text-white px-2.5 py-1 rounded-full">
                  <Zap size={10} /> AI
                </span>
              )}
            </div>

            <button
              onClick={() => setFiltersOpen((o) => !o)}
              className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border transition-all ${
                filtersOpen || activeFilterCount > 0
                  ? 'border-primary text-primary bg-primary4'
                  : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
              }`}
            >
              <SlidersHorizontal size={15} />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-primary text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${filtersOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
        )}

        {/* ── AI Refinement Chips ───────────────────────────── */}
        {searched && !loading && suggestions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-5 -mt-1">
            <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
              <Sparkles size={10} className="text-primary" /> Refine:
            </span>
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => { setInput(s); setSearchParams({ q: s }); setSuggestions([]); }}
                className="text-xs bg-white border border-gray-200 hover:border-primary hover:bg-primary4 hover:text-primary text-gray-600 px-3 py-1.5 rounded-full transition-all font-medium shadow-sm"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* ── Filter panel ──────────────────────────────────── */}
        {filtersOpen && searched && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-5 shadow-sm animate-fade-up">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Category
                </label>
                <select
                  value={filters.category_id}
                  onChange={(e) => setFilters((f) => ({ ...f, category_id: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary bg-gray-50 focus:bg-white transition-colors"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.category_id} value={c.category_id}>
                      {c.category_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Brand */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Brand
                </label>
                <select
                  value={filters.brand_id}
                  onChange={(e) => setFilters((f) => ({ ...f, brand_id: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary bg-gray-50 focus:bg-white transition-colors"
                >
                  <option value="">All Brands</option>
                  {brands.map((b) => (
                    <option key={b.brand_id} value={b.brand_id}>
                      {b.brand_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Price Range
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.min_price}
                    onChange={(e) => setFilters((f) => ({ ...f, min_price: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary bg-gray-50 focus:bg-white transition-colors"
                  />
                  <span className="text-gray-400 text-sm">–</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.max_price}
                    onChange={(e) => setFilters((f) => ({ ...f, max_price: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary bg-gray-50 focus:bg-white transition-colors"
                  />
                </div>
                {/* Price presets */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {PRICE_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => applyPricePreset(p)}
                      className="text-[10px] font-semibold bg-gray-100 hover:bg-primary4 hover:text-primary text-gray-500 px-2 py-1 rounded-lg transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stock & Actions */}
              <div className="flex flex-col justify-between gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Availability
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <div
                      onClick={() => setFilters((f) => ({ ...f, in_stock: !f.in_stock }))}
                      className={`w-10 h-5.5 rounded-full relative transition-colors duration-200 cursor-pointer ${
                        filters.in_stock ? 'bg-primary' : 'bg-gray-200'
                      }`}
                      style={{ height: '22px' }}
                    >
                      <div
                        className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                          filters.in_stock ? 'translate-x-[22px]' : 'translate-x-0.5'
                        }`}
                        style={{ width: '18px', height: '18px' }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700">In Stock Only</span>
                  </label>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={resetFilters}
                    className="flex-1 text-sm text-gray-500 border border-gray-200 rounded-xl py-2 hover:border-gray-300 hover:bg-gray-50 transition-colors font-medium"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => { setFiltersOpen(false); if (query) doSearch(query); }}
                    className="flex-1 text-sm bg-primary text-white rounded-xl py-2 hover:bg-primary1 transition-colors font-bold"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Product grid ──────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {Array(12).fill(0).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : searched ? (
          products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {products.map((p) => (
                <ProductCard key={p.product_id} product={p} />
              ))}
            </div>
          ) : (
            <EmptyState query={query} onSuggestion={handleSuggestion} />
          )
        ) : (
          <LandingState onSuggestion={handleSuggestion} />
        )}
      </div>
    </div>
  );
}

function EmptyState({ query, onSuggestion }) {
  return (
    <div className="text-center py-20">
      <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
        <Package size={36} className="text-gray-400" />
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">No results found</h2>
      <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
        We couldn't find anything for <strong>"{query}"</strong>. Try different keywords or browse our catalog.
      </p>
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {SUGGESTIONS.slice(0, 4).map((s) => (
          <button
            key={s}
            onClick={() => onSuggestion(s)}
            className="text-sm bg-primary4 hover:bg-primary3/30 text-primary px-4 py-2 rounded-xl transition-colors font-semibold"
          >
            {s}
          </button>
        ))}
      </div>
      <Link
        to="/products"
        className="inline-flex items-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-primary1 transition-colors shadow-sm"
      >
        Browse All Products
      </Link>
    </div>
  );
}

function LandingState({ onSuggestion }) {
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-primary2/10 rounded-3xl flex items-center justify-center mx-auto mb-5">
        <Sparkles size={36} className="text-primary" />
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">Search anything, naturally</h2>
      <p className="text-gray-400 text-sm mb-8 max-w-sm mx-auto">
        Our AI understands natural language — describe what you want, and we'll find it.
      </p>

      <div className="max-w-md mx-auto">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center justify-center gap-2">
          <TrendingUp size={12} /> Popular searches
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => onSuggestion(s)}
              className="text-sm bg-white border border-gray-200 hover:border-primary hover:bg-primary4 hover:text-primary text-gray-600 px-4 py-2 rounded-xl transition-all duration-200 font-medium shadow-sm hover:shadow"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
