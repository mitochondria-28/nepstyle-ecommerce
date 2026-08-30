import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAllBrands } from '../api';
import { SkeletonCard } from '../components/LoadingSpinner';

export default function AllBrandsPage() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllBrands()
      .then((res) => setBrands(res.data.brands || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="skeleton h-8 w-36 mb-6 rounded" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-primary mb-6">All Brands</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {brands.map((brand) => (
          <Link key={brand.brand_id} to={`/brands/${brand.brand_id}`}
            className="bg-white rounded-xl shadow-sm p-5 flex flex-col items-center gap-3 hover:shadow-md transition-shadow">
            <img
              src={brand.brand_thumbnail}
              alt={brand.brand_name}
              className="w-20 h-20 object-contain rounded-xl"
              onError={(e) => { e.target.src = 'https://via.placeholder.com/80?text=B'; }}
            />
            <div className="text-center">
              <p className="font-bold text-primary text-sm">{brand.brand_name}</p>
              {brand.brand_description && (
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{brand.brand_description}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
