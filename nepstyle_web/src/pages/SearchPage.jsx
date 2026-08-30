import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { searchProducts } from '../api';
import ProductCard from '../components/ProductCard';
import { SkeletonCard } from '../components/LoadingSpinner';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [input, setInput] = useState(query);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (query) doSearch(query);
  }, [query]);

  const doSearch = async (q) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await searchProducts(q);
      setProducts(res.data.products || []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      setSearchParams({ q: input.trim() });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-primary mb-4">Search Products</h1>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border-2 border-primary rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary2"
            placeholder="Search for products..."
            autoFocus
          />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary px-4 py-1.5 rounded-lg text-sm">
            Search
          </button>
        </div>
      </form>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : searched ? (
        products.length > 0 ? (
          <>
            <p className="text-sm text-gray-500 mb-4">{products.length} results for "<span className="font-semibold text-primary">{query}</span>"</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p) => <ProductCard key={p.product_id} product={p} />)}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <Search size={64} className="mx-auto text-primary3 mb-4" />
            <p className="text-xl font-semibold text-primary mb-2">No results found</p>
            <p className="text-gray-400">Try different keywords or browse our categories</p>
          </div>
        )
      ) : (
        <div className="text-center py-16">
          <Search size={64} className="mx-auto text-primary3 mb-4" />
          <p className="text-gray-400">Type something to search products</p>
        </div>
      )}
    </div>
  );
}
