import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { fetchProductsByBrand, fetchAllBrands } from '../api';
import ProductCard from '../components/ProductCard';
import { SkeletonCard } from '../components/LoadingSpinner';
import BrandAIProfile from '../components/BrandAIProfile';

export default function BrandProductsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchProductsByBrand(id),
      fetchAllBrands(),
    ]).then(([pRes, bRes]) => {
      setProducts(pRes.data.products || []);
      const b = (bRes.data.brands || []).find((br) => br.brand_id === Number(id));
      setBrand(b);
    }).catch(() => {})
    .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-primary2 mb-4 hover:text-primary">
        <ArrowLeft size={18} /> Back
      </button>

      {brand && (
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 flex items-center gap-5">
          <img src={brand.brand_thumbnail} alt={brand.brand_name}
            className="w-20 h-20 object-contain rounded-xl flex-shrink-0"
            onError={(e) => { e.target.src = 'https://via.placeholder.com/80?text=B'; }} />
          <div>
            <h1 className="text-2xl font-bold text-primary">{brand.brand_name}</h1>
            {brand.brand_description && <p className="text-gray-500 text-sm mt-1">{brand.brand_description}</p>}
            <p className="text-primary2 text-sm mt-1 font-medium">{products.length} products</p>
          </div>
        </div>
      )}

      {!brand && <h1 className="text-2xl font-bold text-primary mb-6">Brand Products</h1>}

      <BrandAIProfile brandId={Number(id)} />

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No products for this brand</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => <ProductCard key={p.product_id} product={p} />)}
        </div>
      )}
    </div>
  );
}
