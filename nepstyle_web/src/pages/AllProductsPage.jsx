import { useEffect, useState } from 'react';
import { fetchAllProducts } from '../api';
import ProductCard from '../components/ProductCard';
import { SkeletonCard } from '../components/LoadingSpinner';

export default function AllProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('default');

  useEffect(() => {
    fetchAllProducts()
      .then((res) => setProducts(res.data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...products].sort((a, b) => {
    if (sort === 'price-asc') return a.sell_price - b.sell_price;
    if (sort === 'price-desc') return b.sell_price - a.sell_price;
    if (sort === 'name') return a.product_name.localeCompare(b.product_name);
    return 0;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">All Products</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">{products.length} products</span>
          <select className="input-field w-auto text-sm py-1.5 px-3" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="default">Default</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array(12).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No products found</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {sorted.map((p) => <ProductCard key={p.product_id} product={p} />)}
        </div>
      )}
    </div>
  );
}
