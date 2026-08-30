import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { fetchProductsByCategory, fetchAllCategories } from '../api';
import ProductCard from '../components/ProductCard';
import { SkeletonCard } from '../components/LoadingSpinner';

export default function CategoryProductsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchProductsByCategory(id),
      fetchAllCategories(),
    ]).then(([pRes, cRes]) => {
      setProducts(pRes.data.products || []);
      const cat = (cRes.data.categories || []).find((c) => c.category_id === Number(id));
      setCategory(cat);
    }).catch(() => {})
    .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-primary2 mb-4 hover:text-primary">
        <ArrowLeft size={18} /> Back
      </button>

      {category && (
        <div className="relative h-40 rounded-2xl overflow-hidden mb-6">
          <img src={category.category_thumbnail} alt={category.category_name}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = `https://via.placeholder.com/1200x160?text=${category.category_name}`; }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-5">
            <div>
              <h1 className="text-2xl font-bold text-white">{category.category_name}</h1>
              <p className="text-white/70 text-sm">{products.length} products</p>
            </div>
          </div>
        </div>
      )}

      {!category && <h1 className="text-2xl font-bold text-primary mb-6">Category Products</h1>}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No products in this category</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => <ProductCard key={p.product_id} product={p} />)}
        </div>
      )}
    </div>
  );
}
